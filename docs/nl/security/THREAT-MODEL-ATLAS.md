---
read_when:
    - Beoordelen van de beveiligingshouding of dreigingsscenario's
    - Werken aan beveiligingsfuncties of auditreacties
summary: OpenClaw-dreigingsmodel in kaart gebracht volgens het MITRE ATLAS-framework
title: Dreigingsmodel (MITRE ATLAS)
x-i18n:
    generated_at: "2026-05-06T18:00:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7371231e9795cd899d727b87dfba7a5cae963f1fd1e50226e3fbb7488ef7381
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## MITRE ATLAS-framework

**Versie:** 1.0-concept
**Laatst bijgewerkt:** 2026-02-04
**Methodologie:** MITRE ATLAS + gegevensstroomdiagrammen
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (vijandig dreigingslandschap voor AI-systemen)

### Frameworktoeschrijving

Dit dreigingsmodel is gebouwd op [MITRE ATLAS](https://atlas.mitre.org/), het industriestandaardframework voor het documenteren van vijandige dreigingen voor AI/ML-systemen. ATLAS wordt onderhouden door [MITRE](https://www.mitre.org/) in samenwerking met de AI-beveiligingsgemeenschap.

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

Dit dreigingsmodel documenteert vijandige dreigingen voor het OpenClaw AI-agentplatform en de ClawHub Skills-marktplaats, met gebruik van het MITRE ATLAS-framework dat specifiek is ontworpen voor AI/ML-systemen.

### 1.2 Reikwijdte

| Component              | Opgenomen | Opmerkingen                                      |
| ---------------------- | --------- | ------------------------------------------------ |
| OpenClaw Agent Runtime | Ja        | Kernuitvoering van agents, toolaanroepen, sessies |
| Gateway                | Ja        | Authenticatie, routering, kanaalintegratie       |
| Kanaalintegraties      | Ja        | WhatsApp, Telegram, Discord, Signal, Slack, enz. |
| ClawHub-marktplaats    | Ja        | Publiceren, modereren en distribueren van Skills |
| MCP-servers            | Ja        | Externe toolproviders                            |
| Gebruikersapparaten    | Gedeeltelijk | Mobiele apps, desktopclients                  |

### 1.3 Buiten reikwijdte

Niets valt expliciet buiten de reikwijdte van dit dreigingsmodel.

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
| ------ | ------- | ----------- | ------------------ | -------------------- |
| F1     | Kanaal  | Gateway     | Gebruikersberichten | TLS, AllowFrom      |
| F2     | Gateway | Agent       | Gerouteerde berichten | Sessie-isolatie   |
| F3     | Agent   | Tools       | Toolaanroepen      | Beleidsafdwinging    |
| F4     | Agent   | Extern      | web_fetch-aanvragen | SSRF-blokkering     |
| F5     | ClawHub | Agent       | Skill-code         | Moderatie, scanning  |
| F6     | Agent   | Kanaal      | Reacties           | Uitvoerfiltering     |

---

## 3. Dreigingsanalyse per ATLAS-tactiek

### 3.1 Verkenning (AML.TA0002)

#### T-RECON-001: Ontdekking van agent-eindpunten

| Kenmerk                 | Waarde                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Actief scannen                                           |
| **Beschrijving**        | Aanvaller scant op blootgestelde OpenClaw Gateway-eindpunten         |
| **Aanvalsvector**       | Netwerkscanning, Shodan-query's, DNS-enumeratie                      |
| **Betrokken componenten** | Gateway, blootgestelde API-eindpunten                              |
| **Huidige mitigaties**  | Tailscale-authenticatieoptie, standaard binden aan loopback          |
| **Restrisico**          | Middel - openbare gateways zijn vindbaar                             |
| **Aanbevelingen**       | Veilige implementatie documenteren, rate limiting toevoegen op ontdekkingseindpunten |

#### T-RECON-002: Kanaalintegratie aftasten

| Kenmerk                | Waarde                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0006 - Actief scannen                                          |
| **Beschrijving**       | Aanvaller onderzoekt berichtkanalen om door AI beheerde accounts te identificeren |
| **Aanvalsvector**      | Testberichten verzenden, responspatronen observeren                 |
| **Betrokken componenten** | Alle kanaalintegraties                                           |
| **Huidige mitigaties** | Geen specifieke                                                     |
| **Restrisico**         | Laag - Beperkte waarde van ontdekking alleen                        |
| **Aanbevelingen**      | Overweeg randomisatie van responstiming                             |

---

### 3.2 Initiële toegang (AML.TA0004)

#### T-ACCESS-001: Onderschepping van koppelingscode

| Kenmerk                | Waarde                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0040 - Toegang tot AI-model-inferentie-API                                                                |
| **Beschrijving**       | Aanvaller onderschept koppelingscode tijdens respijtperiode voor koppeling (1u voor DM-kanaalkoppeling, 5m voor Node-koppeling) |
| **Aanvalsvector**      | Meekijken over de schouder, netwerksniffing, social engineering                                                |
| **Betrokken componenten** | Systeem voor apparaatkoppeling                                                                              |
| **Huidige mitigaties** | Verloop na 1u (DM-koppeling) / verloop na 5m (Node-koppeling), codes verzonden via bestaand kanaal             |
| **Restrisico**         | Middel - Respijtperiode is uitbuitbaar                                                                         |
| **Aanbevelingen**      | Verkort de respijtperiode, voeg bevestigingsstap toe                                                           |

#### T-ACCESS-002: AllowFrom-spoofing

| Kenmerk                | Waarde                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0040 - Toegang tot AI-model-inferentie-API                                 |
| **Beschrijving**       | Aanvaller vervalst toegestane afzenderidentiteit in kanaal                      |
| **Aanvalsvector**      | Afhankelijk van kanaal - spoofing van telefoonnummer, impersonatie van gebruikersnaam |
| **Betrokken componenten** | AllowFrom-validatie per kanaal                                               |
| **Huidige mitigaties** | Kanaalspecifieke identiteitsverificatie                                         |
| **Restrisico**         | Middel - Sommige kanalen zijn kwetsbaar voor spoofing                           |
| **Aanbevelingen**      | Documenteer kanaalspecifieke risico's, voeg waar mogelijk cryptografische verificatie toe |

#### T-ACCESS-003: Tokendiefstal

| Kenmerk                | Waarde                                                       |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS-ID**           | AML.T0040 - Toegang tot AI-model-inferentie-API              |
| **Beschrijving**       | Aanvaller steelt authenticatietokens uit configuratiebestanden |
| **Aanvalsvector**      | Malware, ongeautoriseerde apparaattoegang, blootstelling van configuratieback-ups |
| **Betrokken componenten** | ~/.openclaw/credentials/, configuratieopslag              |
| **Huidige mitigaties** | Bestandsmachtigingen                                         |
| **Restrisico**         | Hoog - Tokens worden in platte tekst opgeslagen              |
| **Aanbevelingen**      | Implementeer tokenversleuteling in rust, voeg tokenrotatie toe |

---

### 3.3 Uitvoering (AML.TA0005)

#### T-EXEC-001: Directe promptinjectie

| Kenmerk                | Waarde                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **ATLAS-ID**           | AML.T0051.000 - LLM-promptinjectie: direct                                                 |
| **Beschrijving**       | Aanvaller verzendt zorgvuldig geconstrueerde prompts om agentgedrag te manipuleren          |
| **Aanvalsvector**      | Kanaalberichten met vijandige instructies                                                   |
| **Betrokken componenten** | Agent-LLM, alle invoeroppervlakken                                                       |
| **Huidige mitigaties** | Patroondetectie, omhulling van externe inhoud                                               |
| **Restrisico**         | Kritiek - Alleen detectie, geen blokkering; geavanceerde aanvallen omzeilen dit             |
| **Aanbevelingen**      | Implementeer meerlaagse verdediging, uitvoervalidatie, gebruikersbevestiging voor gevoelige acties |

#### T-EXEC-002: Indirecte promptinjectie

| Kenmerk                | Waarde                                                       |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS-ID**           | AML.T0051.001 - LLM-promptinjectie: indirect                 |
| **Beschrijving**       | Aanvaller sluit kwaadaardige instructies in opgehaalde inhoud in |
| **Aanvalsvector**      | Kwaadaardige URL's, vergiftigde e-mails, gecompromitteerde webhooks |
| **Betrokken componenten** | web_fetch, e-mailinname, externe gegevensbronnen          |
| **Huidige mitigaties** | Inhoudsomsluiting met XML-tags en beveiligingsmelding        |
| **Restrisico**         | Hoog - LLM kan omhullingsinstructies negeren                 |
| **Aanbevelingen**      | Implementeer inhoudssanering, gescheiden uitvoeringscontexten |

#### T-EXEC-003: Injectie van toolargumenten

| Kenmerk                | Waarde                                                        |
| ---------------------- | ------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0051.000 - LLM-promptinjectie: direct                    |
| **Beschrijving**       | Aanvaller manipuleert toolargumenten via promptinjectie       |
| **Aanvalsvector**      | Zorgvuldig geconstrueerde prompts die toolparameterwaarden beïnvloeden |
| **Betrokken componenten** | Alle toolaanroepen                                         |
| **Huidige mitigaties** | Exec-goedkeuringen voor gevaarlijke opdrachten                |
| **Restrisico**         | Hoog - Vertrouwt op gebruikersoordeel                         |
| **Aanbevelingen**      | Implementeer argumentvalidatie, geparametriseerde toolaanroepen |

#### T-EXEC-004: Omzeiling van Exec-goedkeuring

| Kenmerk                | Waarde                                                      |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0043 - Vijandige gegevens construeren                  |
| **Beschrijving**       | Aanvaller construeert opdrachten die de allowlist voor goedkeuring omzeilen |
| **Aanvalsvector**      | Obfuscatie van opdrachten, misbruik van aliassen, padmanipulatie |
| **Betrokken componenten** | exec-approvals.ts, opdracht-allowlist                    |
| **Huidige mitigaties** | Allowlist + vraagmodus                                      |
| **Restrisico**         | Hoog - Geen sanering van opdrachten                         |
| **Aanbevelingen**      | Implementeer normalisatie van opdrachten, breid blocklist uit |

---

### 3.4 Persistentie (AML.TA0006)

#### T-PERSIST-001: Installatie van kwaadaardige Skill

| Kenmerk                | Waarde                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0010.001 - Compromittering van toeleveringsketen: AI-software        |
| **Beschrijving**       | Aanvaller publiceert kwaadaardige Skill naar ClawHub                      |
| **Aanvalsvector**      | Account aanmaken, Skill publiceren met verborgen kwaadaardige code        |
| **Betrokken componenten** | ClawHub, laden van Skill, uitvoering door agent                        |
| **Huidige mitigaties** | Verificatie van leeftijd van GitHub-account, patroongebaseerde moderatievlaggen |
| **Restrisico**         | Kritiek - Geen sandboxing, beperkte review                                |
| **Aanbevelingen**      | VirusTotal-integratie (in uitvoering), sandboxing van Skills, communityreview |

#### T-PERSIST-002: Vergiftiging van Skill-update

| Kenmerk                | Waarde                                                          |
| ---------------------- | --------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0010.001 - Compromittering van toeleveringsketen: AI-software |
| **Beschrijving**       | Aanvaller compromitteert populaire Skill en pusht kwaadaardige update |
| **Aanvalsvector**      | Accountcompromittering, social engineering van Skill-eigenaar   |
| **Betrokken componenten** | ClawHub-versionering, auto-updateflows                       |
| **Huidige mitigaties** | Versie-fingerprinting                                           |
| **Restrisico**         | Hoog - Auto-updates kunnen kwaadaardige versies ophalen         |
| **Aanbevelingen**      | Implementeer ondertekening van updates, rollbackmogelijkheid, versie-pinning |

#### T-PERSIST-003: Manipulatie van agentconfiguratie

| Kenmerk                | Waarde                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0010.002 - Compromittering van toeleveringsketen: gegevens  |
| **Beschrijving**       | Aanvaller wijzigt agentconfiguratie om toegang persistent te maken |
| **Aanvalsvector**      | Wijziging van configuratiebestand, injectie van instellingen     |
| **Betrokken componenten** | Agentconfiguratie, toolbeleid                                |
| **Huidige mitigaties** | Bestandsmachtigingen                                             |
| **Restrisico**         | Middel - Vereist lokale toegang                                  |
| **Aanbevelingen**      | Integriteitsverificatie van configuratie, auditlogging voor configuratiewijzigingen |

---

### 3.5 Verdedigingsontwijking (AML.TA0007)

#### T-EVADE-001: Omzeiling van moderatiepatronen

| Kenmerk                | Waarde                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0043 - Vijandige gegevens construeren                              |
| **Beschrijving**       | Aanvaller construeert Skill-inhoud om moderatiepatronen te ontwijken    |
| **Aanvalsvector**      | Unicode-homogliefen, coderingstrucs, dynamisch laden                    |
| **Betrokken componenten** | ClawHub moderation.ts                                                |
| **Huidige mitigaties** | Patroongebaseerde FLAG_RULES                                            |
| **Restrisico**         | Hoog - Eenvoudige regex is makkelijk te omzeilen                        |
| **Aanbevelingen**      | Voeg gedragsanalyse toe (VirusTotal Code Insight), AST-gebaseerde detectie |

#### T-EVADE-002: Ontsnapping uit inhoudsomsluiting

| Kenmerk                | Waarde                                                    |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0043 - Vijandige gegevens maken                     |
| **Beschrijving**       | Aanvaller maakt inhoud die uit de XML-wrappercontext ontsnapt |
| **Aanvalsvector**      | Tagmanipulatie, contextverwarring, instructie-override   |
| **Getroffen componenten** | Wrapping van externe inhoud                            |
| **Huidige mitigaties** | XML-tags + beveiligingsmelding                           |
| **Restrisico**         | Middel - Nieuwe ontsnappingen worden regelmatig ontdekt   |
| **Aanbevelingen**      | Meerdere wrapperlagen, validatie aan de uitvoerzijde      |

---

### 3.6 Verkenning (AML.TA0008)

#### T-DISC-001: Toolenumeratie

| Kenmerk                | Waarde                                                |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS-ID**           | AML.T0040 - Toegang tot AI Model Inference API        |
| **Beschrijving**       | Aanvaller inventariseert beschikbare tools via prompts |
| **Aanvalsvector**      | Query's in de stijl van "Welke tools heb je?"         |
| **Getroffen componenten** | Toolregister van de agent                          |
| **Huidige mitigaties** | Geen specifiek                                        |
| **Restrisico**         | Laag - Tools zijn doorgaans gedocumenteerd            |
| **Aanbevelingen**      | Overweeg controles voor toolzichtbaarheid             |

#### T-DISC-002: Extractie van sessiegegevens

| Kenmerk                | Waarde                                                |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS-ID**           | AML.T0040 - Toegang tot AI Model Inference API        |
| **Beschrijving**       | Aanvaller extraheert gevoelige gegevens uit sessiecontext |
| **Aanvalsvector**      | Query's zoals "Wat hebben we besproken?", contextonderzoek |
| **Getroffen componenten** | Sessietranscripten, contextvenster                 |
| **Huidige mitigaties** | Sessie-isolatie per afzender                          |
| **Restrisico**         | Middel - Gegevens binnen de sessie zijn toegankelijk  |
| **Aanbevelingen**      | Implementeer redactie van gevoelige gegevens in context |

---

### 3.7 Verzameling en exfiltratie (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Gegevensdiefstal via web_fetch

| Kenmerk                | Waarde                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Verzameling                                                |
| **Beschrijving**       | Aanvaller exfiltreert gegevens door de agent opdracht te geven deze naar een externe URL te sturen |
| **Aanvalsvector**      | Promptinjectie waardoor de agent gegevens naar de server van de aanvaller POST |
| **Getroffen componenten** | web_fetch-tool                                                      |
| **Huidige mitigaties** | SSRF-blokkering voor interne netwerken                                 |
| **Restrisico**         | Hoog - Externe URL's zijn toegestaan                                   |
| **Aanbevelingen**      | Implementeer URL-allowlisting, bewustzijn van gegevensclassificatie     |

#### T-EXFIL-002: Ongeautoriseerd berichten verzenden

| Kenmerk                | Waarde                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Verzameling                                           |
| **Beschrijving**       | Aanvaller zorgt dat de agent berichten met gevoelige gegevens verzendt |
| **Aanvalsvector**      | Promptinjectie waardoor de agent de aanvaller een bericht stuurt |
| **Getroffen componenten** | Berichtentool, kanaalintegraties                              |
| **Huidige mitigaties** | Gating voor uitgaande berichten                                  |
| **Restrisico**         | Middel - Gating kan worden omzeild                               |
| **Aanbevelingen**      | Vereis expliciete bevestiging voor nieuwe ontvangers             |

#### T-EXFIL-003: Verzamelen van referenties

| Kenmerk                | Waarde                                                  |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Verzameling                                  |
| **Beschrijving**       | Kwaadaardige Skill verzamelt referenties uit agentcontext |
| **Aanvalsvector**      | Skill-code leest omgevingsvariabelen, configuratiebestanden |
| **Getroffen componenten** | Uitvoeringsomgeving voor Skills                     |
| **Huidige mitigaties** | Geen specifiek voor Skills                              |
| **Restrisico**         | Kritiek - Skills draaien met agentrechten               |
| **Aanbevelingen**      | Sandboxing van Skills, isolatie van referenties         |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001: Ongeautoriseerde opdrachtuitvoering

| Kenmerk                | Waarde                                              |
| ---------------------- | --------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integriteit van AI-model aantasten      |
| **Beschrijving**       | Aanvaller voert willekeurige opdrachten uit op het gebruikerssysteem |
| **Aanvalsvector**      | Promptinjectie gecombineerd met omzeiling van exec-goedkeuring |
| **Getroffen componenten** | Bash-tool, opdrachtuitvoering                    |
| **Huidige mitigaties** | Exec-goedkeuringen, Docker-sandboxoptie             |
| **Restrisico**         | Kritiek - Hostuitvoering zonder sandbox             |
| **Aanbevelingen**      | Standaard sandbox gebruiken, goedkeurings-UX verbeteren |

#### T-IMPACT-002: Uitputting van resources (DoS)

| Kenmerk                | Waarde                                             |
| ---------------------- | -------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integriteit van AI-model aantasten     |
| **Beschrijving**       | Aanvaller put API-tegoeden of rekenresources uit   |
| **Aanvalsvector**      | Geautomatiseerde berichtenflooding, dure toolaanroepen |
| **Getroffen componenten** | Gateway, agentsessies, API-provider             |
| **Huidige mitigaties** | Geen                                               |
| **Restrisico**         | Hoog - Geen rate limiting                          |
| **Aanbevelingen**      | Implementeer snelheidslimieten per afzender, kostenbudgetten |

#### T-IMPACT-003: Reputatieschade

| Kenmerk                | Waarde                                                  |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integriteit van AI-model aantasten          |
| **Beschrijving**       | Aanvaller zorgt dat de agent schadelijke/aanstootgevende inhoud verzendt |
| **Aanvalsvector**      | Promptinjectie die ongepaste antwoorden veroorzaakt     |
| **Getroffen componenten** | Uitvoergeneratie, kanaalberichten                   |
| **Huidige mitigaties** | Inhoudsbeleid van LLM-provider                          |
| **Restrisico**         | Middel - Providerfilters zijn onvolmaakt                |
| **Aanbevelingen**      | Uitvoerfilterlaag, gebruikerscontroles                  |

---

## 4. Analyse van de ClawHub-toeleveringsketen

### 4.1 Huidige beveiligingscontroles

| Controle             | Implementatie              | Effectiviteit                                       |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| Leeftijd GitHub-account | `requireGitHubAccountAge()` | Middel - Verhoogt de drempel voor nieuwe aanvallers |
| Padsanitisatie       | `sanitizePath()`            | Hoog - Voorkomt path traversal                      |
| Bestandstypevalidatie | `isTextFile()`             | Middel - Alleen tekstbestanden, maar die kunnen nog steeds kwaadaardig zijn |
| Groottelimieten      | Totale bundel van 50 MB     | Hoog - Voorkomt uitputting van resources            |
| Vereiste SKILL.md    | Verplichte readme           | Lage beveiligingswaarde - Alleen informatief        |
| Patroonmoderatie     | FLAG_RULES in moderation.ts | Laag - Eenvoudig te omzeilen                        |
| Moderatiestatus      | `moderationStatus`-veld     | Middel - Handmatige beoordeling mogelijk            |

### 4.2 Vlagpatronen voor moderatie

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

- Controleert alleen slug, displayName, samenvatting, frontmatter, metadata, bestandspaden
- Analyseert de daadwerkelijke inhoud van Skill-code niet
- Eenvoudige regex is gemakkelijk te omzeilen met obfuscatie
- Geen gedragsanalyse

### 4.3 Geplande verbeteringen

| Verbetering           | Status                                | Impact                                                                |
| --------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| VirusTotal-integratie | In uitvoering                         | Hoog - Gedragsanalyse met Code Insight                                |
| Communityrapportage   | Gedeeltelijk (`skillReports`-tabel bestaat) | Middel                                                          |
| Auditlogging          | Gedeeltelijk (`auditLogs`-tabel bestaat)    | Middel                                                          |
| Badgesysteem          | Geïmplementeerd                       | Middel - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risicomatrix

### 5.1 Waarschijnlijkheid versus impact

| Dreigings-ID   | Waarschijnlijkheid | Impact   | Risiconiveau | Prioriteit |
| -------------- | ------------------ | -------- | ------------ | ---------- |
| T-EXEC-001     | Hoog               | Kritiek  | **Kritiek**  | P0         |
| T-PERSIST-001  | Hoog               | Kritiek  | **Kritiek**  | P0         |
| T-EXFIL-003    | Middel             | Kritiek  | **Kritiek**  | P0         |
| T-IMPACT-001   | Middel             | Kritiek  | **Hoog**     | P1         |
| T-EXEC-002     | Hoog               | Hoog     | **Hoog**     | P1         |
| T-EXEC-004     | Middel             | Hoog     | **Hoog**     | P1         |
| T-ACCESS-003   | Middel             | Hoog     | **Hoog**     | P1         |
| T-EXFIL-001    | Middel             | Hoog     | **Hoog**     | P1         |
| T-IMPACT-002   | Hoog               | Middel   | **Hoog**     | P1         |
| T-EVADE-001    | Hoog               | Middel   | **Middel**   | P2         |
| T-ACCESS-001   | Laag               | Hoog     | **Middel**   | P2         |
| T-ACCESS-002   | Laag               | Hoog     | **Middel**   | P2         |
| T-PERSIST-002  | Laag               | Hoog     | **Middel**   | P2         |

### 5.2 Kritieke aanvalsketens

**Aanvalsketen 1: Skill-gebaseerde gegevensdiefstal**

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
| R-001 | Voltooi VirusTotal-integratie              | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementeer skill-sandboxing              | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Voeg uitvoervalidatie toe voor gevoelige acties | T-EXEC-001, T-EXEC-002     |

### 6.2 Korte termijn (P1)

| ID    | Aanbeveling                            | Behandelt    |
| ----- | -------------------------------------- | ------------ |
| R-004 | Implementeer rate limiting             | T-IMPACT-002 |
| R-005 | Voeg tokenversleuteling in rust toe    | T-ACCESS-003 |
| R-006 | Verbeter exec-goedkeurings-UX en validatie | T-EXEC-004   |
| R-007 | Implementeer URL-allowlisting voor web_fetch | T-EXFIL-001  |

### 6.3 Middellange termijn (P2)

| ID    | Aanbeveling                                        | Behandelt     |
| ----- | -------------------------------------------------- | ------------- |
| R-008 | Voeg waar mogelijk cryptografische kanaalverificatie toe | T-ACCESS-002  |
| R-009 | Implementeer integriteitsverificatie van configuratie | T-PERSIST-003 |
| R-010 | Voeg update-ondertekening en versiepinnen toe      | T-PERSIST-002 |

---

## 7. Bijlagen

### 7.1 ATLAS-techniektoewijzing

| ATLAS-ID      | Technieknaam                   | OpenClaw-dreigingen                                             |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Actief scannen                 | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Verzameling                    | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Supply chain: AI-software      | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Supply chain: gegevens         | T-PERSIST-003                                                    |
| AML.T0031     | AI-modelintegriteit aantasten  | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Toegang tot AI-modelinferentie-API | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Vijandige gegevens maken       | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM-promptinjectie: direct     | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM-promptinjectie: indirect   | T-EXEC-002                                                       |

### 7.2 Belangrijke beveiligingsbestanden

| Pad                                 | Doel                        | Risiconiveau  |
| ----------------------------------- | --------------------------- | ------------- |
| `src/infra/exec-approvals.ts`       | Logica voor opdrachtgoedkeuringen | **Kritiek** |
| `src/gateway/auth.ts`               | Gateway-authenticatie       | **Kritiek**  |
| `src/infra/net/ssrf.ts`             | SSRF-bescherming            | **Kritiek**  |
| `src/security/external-content.ts`  | Beperking van promptinjectie | **Kritiek** |
| `src/agents/sandbox/tool-policy.ts` | Handhaving van toolbeleid   | **Kritiek**  |
| `src/routing/resolve-route.ts`      | Sessie-isolatie             | **Gemiddeld** |

### 7.3 Woordenlijst

| Term                 | Definitie                                                |
| -------------------- | -------------------------------------------------------- |
| **ATLAS**            | MITRE's Adversarial Threat Landscape for AI Systems      |
| **ClawHub**          | OpenClaw's skillmarktplaats                              |
| **Gateway**          | OpenClaw's laag voor berichtroutering en authenticatie   |
| **MCP**              | Model Context Protocol - interface voor toolproviders    |
| **Promptinjectie**   | Aanval waarbij kwaadaardige instructies in invoer worden ingebed |
| **Skill**            | Downloadbare extensie voor OpenClaw-agenten              |
| **SSRF**             | Server-Side Request Forgery                              |

---

_Dit dreigingsmodel is een levend document. Meld beveiligingsproblemen aan security@openclaw.ai_

## Gerelateerd

- [Formele verificatie](/nl/security/formal-verification)
- [Bijdragen aan het dreigingsmodel](/nl/security/CONTRIBUTING-THREAT-MODEL)
