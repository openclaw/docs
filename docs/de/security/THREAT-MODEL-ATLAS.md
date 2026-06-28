---
read_when:
    - Sicherheitslage oder Bedrohungsszenarien überprüfen
    - Arbeiten an Sicherheitsfunktionen oder Antworten auf Audits
summary: OpenClaw-Bedrohungsmodell, abgebildet auf das MITRE-ATLAS-Framework
title: Bedrohungsmodell (MITRE ATLAS)
x-i18n:
    generated_at: "2026-05-06T18:00:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7371231e9795cd899d727b87dfba7a5cae963f1fd1e50226e3fbb7488ef7381
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## MITRE-ATLAS-Framework

**Version:** 1.0-draft
**Zuletzt aktualisiert:** 2026-02-04
**Methodik:** MITRE ATLAS + Datenflussdiagramme
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Framework-Zuordnung

Dieses Bedrohungsmodell basiert auf [MITRE ATLAS](https://atlas.mitre.org/), dem branchenüblichen Framework zur Dokumentation adversarialer Bedrohungen für KI/ML-Systeme. ATLAS wird von [MITRE](https://www.mitre.org/) in Zusammenarbeit mit der KI-Sicherheitscommunity gepflegt.

**Wichtige ATLAS-Ressourcen:**

- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Taktiken](https://atlas.mitre.org/tactics/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Zu ATLAS beitragen](https://atlas.mitre.org/resources/contribute)

### Zu diesem Bedrohungsmodell beitragen

Dies ist ein lebendes Dokument, das von der OpenClaw-Community gepflegt wird. Richtlinien zum Beitragen finden Sie unter [CONTRIBUTING-THREAT-MODEL.md](/de/security/CONTRIBUTING-THREAT-MODEL):

- Neue Bedrohungen melden
- Bestehende Bedrohungen aktualisieren
- Angriffsketten vorschlagen
- Gegenmaßnahmen vorschlagen

---

## 1. Einführung

### 1.1 Zweck

Dieses Bedrohungsmodell dokumentiert adversariale Bedrohungen für die OpenClaw-KI-Agentenplattform und den ClawHub-Skills-Marktplatz mithilfe des MITRE-ATLAS-Frameworks, das speziell für KI/ML-Systeme entwickelt wurde.

### 1.2 Umfang

| Komponente             | Enthalten | Hinweise                                           |
| ---------------------- | --------- | -------------------------------------------------- |
| OpenClaw Agent Runtime | Ja        | Zentrale Agentenausführung, Tool-Aufrufe, Sitzungen |
| Gateway                | Ja        | Authentifizierung, Routing, Kanalintegration       |
| Kanalintegrationen     | Ja        | WhatsApp, Telegram, Discord, Signal, Slack usw.    |
| ClawHub-Marktplatz     | Ja        | Veröffentlichung, Moderation, Verteilung von Skills |
| MCP-Server             | Ja        | Externe Tool-Provider                              |
| Benutzergeräte         | Teilweise | Mobile Apps, Desktop-Clients                       |

### 1.3 Außerhalb des Umfangs

Für dieses Bedrohungsmodell ist nichts ausdrücklich außerhalb des Umfangs.

---

## 2. Systemarchitektur

### 2.1 Vertrauensgrenzen

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

### 2.2 Datenflüsse

| Fluss | Quelle  | Ziel        | Daten              | Schutz                 |
| ----- | ------- | ----------- | ------------------ | ---------------------- |
| F1    | Kanal   | Gateway     | Benutzernachrichten | TLS, AllowFrom         |
| F2    | Gateway | Agent       | Weitergeleitete Nachrichten | Sitzungsisolierung |
| F3    | Agent   | Tools       | Tool-Aufrufe       | Richtliniendurchsetzung |
| F4    | Agent   | Extern      | web_fetch-Anfragen | SSRF-Blockierung       |
| F5    | ClawHub | Agent       | Skill-Code         | Moderation, Scans      |
| F6    | Agent   | Kanal       | Antworten          | Ausgabefilterung       |

---

## 3. Bedrohungsanalyse nach ATLAS-Taktik

### 3.1 Aufklärung (AML.TA0002)

#### T-RECON-001: Erkennung von Agent-Endpunkten

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Aktives Scannen                                          |
| **Beschreibung**        | Angreifer scannt nach offengelegten OpenClaw-Gateway-Endpunkten      |
| **Angriffsvektor**      | Netzwerk-Scanning, Shodan-Abfragen, DNS-Enumeration                  |
| **Betroffene Komponenten** | Gateway, offengelegte API-Endpunkte                               |
| **Aktuelle Gegenmaßnahmen** | Tailscale-Auth-Option, standardmäßige Bindung an local loopback   |
| **Restrisiko**          | Mittel - Öffentliche Gateways sind auffindbar                        |
| **Empfehlungen**        | Sichere Bereitstellung dokumentieren, Rate-Limiting für Erkennungsendpunkte hinzufügen |

#### T-RECON-002: Untersuchung von Kanalintegrationen

| Attribut                | Wert                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Aktives Scannen                                           |
| **Beschreibung**        | Angreifer sondiert Messaging-Kanäle, um KI-verwaltete Konten zu finden |
| **Angriffsvektor**      | Senden von Testnachrichten, Beobachten von Antwortmustern             |
| **Betroffene Komponenten** | Alle Kanalintegrationen                                            |
| **Aktuelle Mitigations** | Keine spezifischen                                                   |
| **Restrisiko**          | Niedrig - Begrenzter Wert allein durch Entdeckung                     |
| **Empfehlungen**        | Randomisierung der Antwortzeiten erwägen                             |

---

### 3.2 Initialzugriff (AML.TA0004)

#### T-ACCESS-001: Abfangen des Pairing-Codes

| Attribut                | Wert                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf KI-Modell-Inferenz-API                                                                   |
| **Beschreibung**        | Angreifer fängt den Pairing-Code während der Pairing-Nachfrist ab (1 h für DM-Kanal-Pairing, 5 min für Node-Pairing) |
| **Angriffsvektor**      | Shoulder Surfing, Netzwerk-Sniffing, Social Engineering                                                          |
| **Betroffene Komponenten** | Geräte-Pairing-System                                                                                        |
| **Aktuelle Mitigations** | Ablauf nach 1 h (DM-Pairing) / Ablauf nach 5 min (Node-Pairing), Codes werden über vorhandenen Kanal gesendet |
| **Restrisiko**          | Mittel - Nachfrist ausnutzbar                                                                                    |
| **Empfehlungen**        | Nachfrist verkürzen, Bestätigungsschritt hinzufügen                                                              |

#### T-ACCESS-002: AllowFrom-Spoofing

| Attribut                | Wert                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf KI-Modell-Inferenz-API                                             |
| **Beschreibung**        | Angreifer fälscht die Identität eines erlaubten Absenders im Kanal                         |
| **Angriffsvektor**      | Abhängig vom Kanal - Telefonnummern-Spoofing, Identitätsvortäuschung über Benutzernamen    |
| **Betroffene Komponenten** | AllowFrom-Validierung pro Kanal                                                         |
| **Aktuelle Mitigations** | Kanalspezifische Identitätsprüfung                                                        |
| **Restrisiko**          | Mittel - Einige Kanäle sind anfällig für Spoofing                                          |
| **Empfehlungen**        | Kanalspezifische Risiken dokumentieren, kryptografische Verifizierung hinzufügen, wo möglich |

#### T-ACCESS-003: Token-Diebstahl

| Attribut                | Wert                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf KI-Modell-Inferenz-API                      |
| **Beschreibung**        | Angreifer stiehlt Authentifizierungs-Tokens aus Konfigurationsdateien |
| **Angriffsvektor**      | Malware, unbefugter Gerätezugriff, Offenlegung von Konfigurations-Backups |
| **Betroffene Komponenten** | ~/.openclaw/credentials/, Konfigurationsspeicher                  |
| **Aktuelle Mitigations** | Dateiberechtigungen                                                |
| **Restrisiko**          | Hoch - Tokens werden im Klartext gespeichert                        |
| **Empfehlungen**        | Token-Verschlüsselung im Ruhezustand implementieren, Token-Rotation hinzufügen |

---

### 3.3 Ausführung (AML.TA0005)

#### T-EXEC-001: Direkte Prompt-Injection

| Attribut                | Wert                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                                              |
| **Beschreibung**        | Angreifer sendet präparierte Prompts, um das Verhalten des Agenten zu manipulieren         |
| **Angriffsvektor**      | Kanalnachrichten mit gegnerischen Anweisungen                                             |
| **Betroffene Komponenten** | Agent-LLM, alle Eingabeflächen                                                         |
| **Aktuelle Mitigations** | Mustererkennung, Umhüllung externer Inhalte                                               |
| **Restrisiko**          | Kritisch - Nur Erkennung, keine Blockierung; ausgefeilte Angriffe umgehen sie             |
| **Empfehlungen**        | Mehrschichtige Abwehr, Ausgabevalidierung und Benutzerbestätigung für sensible Aktionen implementieren |

#### T-EXEC-002: Indirekte Prompt-Injection

| Attribut                | Wert                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.001 - LLM-Prompt-Injection: Indirekt                    |
| **Beschreibung**        | Angreifer bettet bösartige Anweisungen in abgerufene Inhalte ein  |
| **Angriffsvektor**      | Bösartige URLs, vergiftete E-Mails, kompromittierte Webhooks      |
| **Betroffene Komponenten** | web_fetch, E-Mail-Ingestion, externe Datenquellen              |
| **Aktuelle Mitigations** | Inhaltsumhüllung mit XML-Tags und Sicherheitshinweis             |
| **Restrisiko**          | Hoch - LLM ignoriert möglicherweise Wrapper-Anweisungen           |
| **Empfehlungen**        | Inhaltssanitisierung implementieren, Ausführungskontexte trennen  |

#### T-EXEC-003: Tool-Argument-Injection

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                         |
| **Beschreibung**        | Angreifer manipuliert Tool-Argumente durch Prompt-Injection          |
| **Angriffsvektor**      | Präparierte Prompts, die Tool-Parameterwerte beeinflussen            |
| **Betroffene Komponenten** | Alle Tool-Aufrufe                                                 |
| **Aktuelle Mitigations** | Exec-Genehmigungen für gefährliche Befehle                          |
| **Restrisiko**          | Hoch - Verlässt sich auf das Urteilsvermögen des Benutzers           |
| **Empfehlungen**        | Argumentvalidierung, parametrisierte Tool-Aufrufe implementieren     |

#### T-EXEC-004: Umgehung der Exec-Genehmigung

| Attribut                | Wert                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Gegnerische Daten erstellen                            |
| **Beschreibung**        | Angreifer erstellt Befehle, die die Genehmigungs-Allowlist umgehen |
| **Angriffsvektor**      | Befehlsverschleierung, Alias-Ausnutzung, Pfadmanipulation          |
| **Betroffene Komponenten** | exec-approvals.ts, Befehls-Allowlist                            |
| **Aktuelle Mitigations** | Allowlist + Ask-Modus                                             |
| **Restrisiko**          | Hoch - Keine Befehlssanitisierung                                  |
| **Empfehlungen**        | Befehlsnormalisierung implementieren, Blocklist erweitern          |

---

### 3.4 Persistenz (AML.TA0006)

#### T-PERSIST-001: Installation bösartiger Skills

| Attribut                | Wert                                                                      |
| ----------------------- | ------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Supply-Chain-Kompromittierung: KI-Software                |
| **Beschreibung**        | Angreifer veröffentlicht bösartigen Skill auf ClawHub                     |
| **Angriffsvektor**      | Konto erstellen, Skill mit verborgenem bösartigem Code veröffentlichen   |
| **Betroffene Komponenten** | ClawHub, Skill-Laden, Agent-Ausführung                                 |
| **Aktuelle Mitigations** | Verifizierung des Alters des GitHub-Kontos, musterbasierte Moderations-Flags |
| **Restrisiko**          | Kritisch - Kein Sandboxing, begrenzte Prüfung                             |
| **Empfehlungen**        | VirusTotal-Integration (in Arbeit), Skill-Sandboxing, Community-Prüfung   |

#### T-PERSIST-002: Vergiftung von Skill-Updates

| Attribut                | Wert                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Supply-Chain-Kompromittierung: KI-Software          |
| **Beschreibung**        | Angreifer kompromittiert beliebten Skill und spielt bösartiges Update ein |
| **Angriffsvektor**      | Kontokompromittierung, Social Engineering beim Skill-Eigentümer     |
| **Betroffene Komponenten** | ClawHub-Versionierung, Auto-Update-Abläufe                       |
| **Aktuelle Mitigations** | Versions-Fingerprinting                                            |
| **Restrisiko**          | Hoch - Auto-Updates können bösartige Versionen abrufen              |
| **Empfehlungen**        | Update-Signierung, Rollback-Fähigkeit, Versions-Pinning implementieren |

#### T-PERSIST-003: Manipulation der Agent-Konfiguration

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.002 - Supply-Chain-Kompromittierung: Daten                 |
| **Beschreibung**        | Angreifer ändert die Agent-Konfiguration, um Zugriff dauerhaft zu machen |
| **Angriffsvektor**      | Änderung von Konfigurationsdateien, Einschleusen von Einstellungen   |
| **Betroffene Komponenten** | Agent-Konfiguration, Tool-Richtlinien                              |
| **Aktuelle Mitigations** | Dateiberechtigungen                                                 |
| **Restrisiko**          | Mittel - Erfordert lokalen Zugriff                                   |
| **Empfehlungen**        | Integritätsprüfung der Konfiguration, Audit-Protokollierung für Konfigurationsänderungen |

---

### 3.5 Abwehrumgehung (AML.TA0007)

#### T-EVADE-001: Umgehung von Moderationsmustern

| Attribut                | Wert                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Gegnerische Daten erstellen                                  |
| **Beschreibung**        | Angreifer gestaltet Skill-Inhalte so, dass Moderationsmuster umgangen werden |
| **Angriffsvektor**      | Unicode-Homoglyphen, Encoding-Tricks, dynamisches Laden                  |
| **Betroffene Komponenten** | ClawHub moderation.ts                                                 |
| **Aktuelle Mitigations** | Musterbasierte FLAG_RULES                                               |
| **Restrisiko**          | Hoch - Einfache Regex leicht umgehbar                                    |
| **Empfehlungen**        | Verhaltensanalyse hinzufügen (VirusTotal Code Insight), AST-basierte Erkennung |

#### T-EVADE-002: Ausbruch aus dem Content-Wrapper

| Attribut               | Wert                                                      |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0043 - Adversariale Daten erstellen                 |
| **Beschreibung**       | Angreifer erstellt Inhalte, die aus dem XML-Wrapper-Kontext ausbrechen |
| **Angriffsvektor**     | Tag-Manipulation, Kontextverwirrung, Überschreiben von Anweisungen |
| **Betroffene Komponenten** | Wrapping externer Inhalte                             |
| **Aktuelle Gegenmaßnahmen** | XML-Tags + Sicherheitshinweis                       |
| **Restrisiko**         | Mittel - Neue Ausbrüche werden regelmäßig entdeckt       |
| **Empfehlungen**       | Mehrere Wrapper-Ebenen, ausgabeseitige Validierung       |

---

### 3.6 Erkennung (AML.TA0008)

#### T-DISC-001: Tool-Aufzählung

| Attribut               | Wert                                                  |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS-ID**           | AML.T0040 - Zugriff auf AI Model Inference API        |
| **Beschreibung**       | Angreifer zählt verfügbare Tools durch Prompting auf  |
| **Angriffsvektor**     | Abfragen im Stil von „Welche Tools haben Sie?“        |
| **Betroffene Komponenten** | Tool-Registry des Agenten                         |
| **Aktuelle Gegenmaßnahmen** | Keine spezifischen                               |
| **Restrisiko**         | Niedrig - Tools sind im Allgemeinen dokumentiert      |
| **Empfehlungen**       | Tool-Sichtbarkeitskontrollen erwägen                  |

#### T-DISC-002: Extraktion von Sitzungsdaten

| Attribut               | Wert                                                  |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS-ID**           | AML.T0040 - Zugriff auf AI Model Inference API        |
| **Beschreibung**       | Angreifer extrahiert sensible Daten aus dem Sitzungskontext |
| **Angriffsvektor**     | Abfragen wie „Was haben wir besprochen?“, Kontextsondierung |
| **Betroffene Komponenten** | Sitzungstranskripte, Kontextfenster               |
| **Aktuelle Gegenmaßnahmen** | Sitzungsisolation pro Absender                    |
| **Restrisiko**         | Mittel - Daten innerhalb der Sitzung sind zugänglich  |
| **Empfehlungen**       | Schwärzung sensibler Daten im Kontext implementieren  |

---

### 3.7 Sammlung & Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Datendiebstahl über web_fetch

| Attribut               | Wert                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Sammlung                                                   |
| **Beschreibung**       | Angreifer exfiltriert Daten, indem er den Agenten anweist, sie an eine externe URL zu senden |
| **Angriffsvektor**     | Prompt-Injection, die den Agenten veranlasst, Daten per POST an den Server des Angreifers zu senden |
| **Betroffene Komponenten** | web_fetch-Tool                                                     |
| **Aktuelle Gegenmaßnahmen** | SSRF-Blockierung für interne Netzwerke                            |
| **Restrisiko**         | Hoch - Externe URLs sind erlaubt                                       |
| **Empfehlungen**       | URL-Allowlisting, Bewusstsein für Datenklassifizierung implementieren  |

#### T-EXFIL-002: Unbefugtes Senden von Nachrichten

| Attribut               | Wert                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Sammlung                                             |
| **Beschreibung**       | Angreifer veranlasst den Agenten, Nachrichten mit sensiblen Daten zu senden |
| **Angriffsvektor**     | Prompt-Injection, die den Agenten veranlasst, dem Angreifer eine Nachricht zu senden |
| **Betroffene Komponenten** | Nachrichten-Tool, Kanalintegrationen                         |
| **Aktuelle Gegenmaßnahmen** | Gating für ausgehende Nachrichten                            |
| **Restrisiko**         | Mittel - Gating kann umgangen werden                             |
| **Empfehlungen**       | Explizite Bestätigung für neue Empfänger verlangen                |

#### T-EXFIL-003: Abgreifen von Anmeldedaten

| Attribut               | Wert                                                    |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Sammlung                                    |
| **Beschreibung**       | Bösartiger Skill sammelt Anmeldedaten aus dem Agentenkontext |
| **Angriffsvektor**     | Skill-Code liest Umgebungsvariablen, Konfigurationsdateien |
| **Betroffene Komponenten** | Skill-Ausführungsumgebung                         |
| **Aktuelle Gegenmaßnahmen** | Keine spezifisch für Skills                       |
| **Restrisiko**         | Kritisch - Skills laufen mit Agentenrechten             |
| **Empfehlungen**       | Skill-Sandboxing, Isolation von Anmeldedaten            |

---

### 3.8 Auswirkung (AML.TA0011)

#### T-IMPACT-001: Unbefugte Befehlsausführung

| Attribut               | Wert                                                |
| ---------------------- | --------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integrität des KI-Modells untergraben   |
| **Beschreibung**       | Angreifer führt beliebige Befehle auf dem Benutzersystem aus |
| **Angriffsvektor**     | Prompt-Injection kombiniert mit Umgehung der Exec-Genehmigung |
| **Betroffene Komponenten** | Bash-Tool, Befehlsausführung                  |
| **Aktuelle Gegenmaßnahmen** | Exec-Genehmigungen, Docker-Sandbox-Option     |
| **Restrisiko**         | Kritisch - Host-Ausführung ohne Sandbox             |
| **Empfehlungen**       | Standardmäßig Sandbox verwenden, Genehmigungs-UX verbessern |

#### T-IMPACT-002: Ressourcenerschöpfung (DoS)

| Attribut               | Wert                                               |
| ---------------------- | -------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integrität des KI-Modells untergraben  |
| **Beschreibung**       | Angreifer erschöpft API-Guthaben oder Rechenressourcen |
| **Angriffsvektor**     | Automatisierte Nachrichtenflut, teure Tool-Aufrufe |
| **Betroffene Komponenten** | Gateway, Agentensitzungen, API-Provider      |
| **Aktuelle Gegenmaßnahmen** | Keine                                      |
| **Restrisiko**         | Hoch - Keine Ratenbegrenzung                       |
| **Empfehlungen**       | Ratenbegrenzungen pro Absender, Kostenbudgets implementieren |

#### T-IMPACT-003: Reputationsschaden

| Attribut               | Wert                                                    |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integrität des KI-Modells untergraben       |
| **Beschreibung**       | Angreifer veranlasst den Agenten, schädliche/anstößige Inhalte zu senden |
| **Angriffsvektor**     | Prompt-Injection, die unangemessene Antworten verursacht |
| **Betroffene Komponenten** | Ausgabegenerierung, Kanalnachrichten              |
| **Aktuelle Gegenmaßnahmen** | Inhaltsrichtlinien des LLM-Providers              |
| **Restrisiko**         | Mittel - Provider-Filter sind unvollkommen              |
| **Empfehlungen**       | Ausgabefilterebene, Benutzerkontrollen                  |

---

## 4. ClawHub-Supply-Chain-Analyse

### 4.1 Aktuelle Sicherheitskontrollen

| Kontrolle              | Implementierung              | Wirksamkeit                                           |
| ---------------------- | ---------------------------- | ----------------------------------------------------- |
| Alter des GitHub-Kontos | `requireGitHubAccountAge()` | Mittel - Erhöht die Hürde für neue Angreifer         |
| Pfadbereinigung        | `sanitizePath()`             | Hoch - Verhindert Path Traversal                      |
| Dateitypvalidierung    | `isTextFile()`               | Mittel - Nur Textdateien, können aber trotzdem bösartig sein |
| Größenlimits           | 50 MB Gesamt-Bundle          | Hoch - Verhindert Ressourcenerschöpfung               |
| Erforderliche SKILL.md | Obligatorische Readme        | Geringer Sicherheitswert - Nur informativ             |
| Muster-Moderation      | FLAG_RULES in moderation.ts  | Niedrig - Leicht zu umgehen                           |
| Moderationsstatus      | `moderationStatus`-Feld      | Mittel - Manuelle Prüfung möglich                     |

### 4.2 Moderations-Flag-Muster

Aktuelle Muster in `moderation.ts`:

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

**Einschränkungen:**

- Prüft nur Slug, displayName, Zusammenfassung, Frontmatter, Metadaten und Dateipfade
- Analysiert nicht den tatsächlichen Skill-Code-Inhalt
- Einfache Regex kann leicht durch Verschleierung umgangen werden
- Keine Verhaltensanalyse

### 4.3 Geplante Verbesserungen

| Verbesserung           | Status                                | Auswirkung                                                            |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| VirusTotal-Integration | In Arbeit                             | Hoch - Verhaltensanalyse durch Code Insight                           |
| Community-Meldungen    | Teilweise (`skillReports`-Tabelle existiert) | Mittel                                                          |
| Audit-Protokollierung  | Teilweise (`auditLogs`-Tabelle existiert)    | Mittel                                                          |
| Badge-System           | Implementiert                         | Mittel - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risikomatrix

### 5.1 Wahrscheinlichkeit vs. Auswirkung

| Bedrohungs-ID | Wahrscheinlichkeit | Auswirkung | Risikostufe  | Priorität |
| ------------- | ------------------ | ---------- | ------------ | --------- |
| T-EXEC-001    | Hoch               | Kritisch   | **Kritisch** | P0        |
| T-PERSIST-001 | Hoch               | Kritisch   | **Kritisch** | P0        |
| T-EXFIL-003   | Mittel             | Kritisch   | **Kritisch** | P0        |
| T-IMPACT-001  | Mittel             | Kritisch   | **Hoch**     | P1        |
| T-EXEC-002    | Hoch               | Hoch       | **Hoch**     | P1        |
| T-EXEC-004    | Mittel             | Hoch       | **Hoch**     | P1        |
| T-ACCESS-003  | Mittel             | Hoch       | **Hoch**     | P1        |
| T-EXFIL-001   | Mittel             | Hoch       | **Hoch**     | P1        |
| T-IMPACT-002  | Hoch               | Mittel     | **Hoch**     | P1        |
| T-EVADE-001   | Hoch               | Mittel     | **Mittel**   | P2        |
| T-ACCESS-001  | Niedrig            | Hoch       | **Mittel**   | P2        |
| T-ACCESS-002  | Niedrig            | Hoch       | **Mittel**   | P2        |
| T-PERSIST-002 | Niedrig            | Hoch       | **Mittel**   | P2        |

### 5.2 Angriffsketten des kritischen Pfads

**Angriffskette 1: Skill-basierter Datendiebstahl**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Angriffskette 2: Prompt-Injection zu RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Angriffskette 3: Indirekte Injection über abgerufene Inhalte**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Zusammenfassung der Empfehlungen

### 6.1 Sofort (P0)

| ID    | Empfehlung                                 | Behandelt                  |
| ----- | ------------------------------------------ | -------------------------- |
| R-001 | VirusTotal-Integration abschließen         | T-PERSIST-001, T-EVADE-001 |
| R-002 | Skills-Sandboxing implementieren           | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Ausgabevalidierung für sensible Aktionen hinzufügen | T-EXEC-001, T-EXEC-002     |

### 6.2 Kurzfristig (P1)

| ID    | Empfehlung                              | Behandelt    |
| ----- | --------------------------------------- | ------------ |
| R-004 | Rate Limiting implementieren            | T-IMPACT-002 |
| R-005 | Token-Verschlüsselung im Ruhezustand hinzufügen | T-ACCESS-003 |
| R-006 | UX und Validierung für exec-Genehmigungen verbessern | T-EXEC-004   |
| R-007 | URL-Allowlisting für web_fetch implementieren | T-EXFIL-001  |

### 6.3 Mittelfristig (P2)

| ID    | Empfehlung                                           | Behandelt     |
| ----- | ---------------------------------------------------- | ------------- |
| R-008 | Kryptografische Kanalverifizierung hinzufügen, wo möglich | T-ACCESS-002  |
| R-009 | Integritätsprüfung der Konfiguration implementieren  | T-PERSIST-003 |
| R-010 | Update-Signierung und Versions-Pinning hinzufügen    | T-PERSIST-002 |

---

## 7. Anhänge

### 7.1 Zuordnung von ATLAS-Techniken

| ATLAS-ID      | Technikname                    | OpenClaw-Bedrohungen                                             |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Aktives Scannen                | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Sammlung                       | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Lieferkette: KI-Software       | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Lieferkette: Daten             | T-PERSIST-003                                                    |
| AML.T0031     | Integrität des KI-Modells untergraben | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Zugriff auf KI-Modell-Inferenz-API | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Gegnerische Daten erstellen    | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM-Prompt-Injection: Direkt   | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM-Prompt-Injection: Indirekt | T-EXEC-002                                                       |

### 7.2 Zentrale Sicherheitsdateien

| Pfad                                | Zweck                       | Risikostufe  |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logik für Befehlsfreigaben  | **Kritisch** |
| `src/gateway/auth.ts`               | Gateway-Authentifizierung   | **Kritisch** |
| `src/infra/net/ssrf.ts`             | SSRF-Schutz                 | **Kritisch** |
| `src/security/external-content.ts`  | Minderung von Prompt Injection | **Kritisch** |
| `src/agents/sandbox/tool-policy.ts` | Durchsetzung der Tool-Richtlinie | **Kritisch** |
| `src/routing/resolve-route.ts`      | Sitzungsisolation           | **Mittel**   |

### 7.3 Glossar

| Begriff              | Definition                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | MITREs Adversarial Threat Landscape for AI Systems        |
| **ClawHub**          | OpenClaws Marktplatz für Skills                           |
| **Gateway**          | OpenClaws Nachrichtenrouting- und Authentifizierungsschicht |
| **MCP**              | Model Context Protocol - Schnittstelle für Tool-Provider  |
| **Prompt Injection** | Angriff, bei dem schädliche Anweisungen in Eingaben eingebettet werden |
| **Skill**            | Herunterladbare Erweiterung für OpenClaw-Agenten          |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Dieses Bedrohungsmodell ist ein lebendes Dokument. Melden Sie Sicherheitsprobleme an security@openclaw.ai_

## Verwandte Themen

- [Formale Verifizierung](/de/security/formal-verification)
- [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
