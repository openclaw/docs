---
read_when:
    - Sicherheitslage oder Bedrohungsszenarien überprüfen
    - Arbeiten an Sicherheitsfunktionen oder Audit-Antworten
summary: OpenClaw-Bedrohungsmodell, abgebildet auf das MITRE ATLAS-Framework
title: Bedrohungsmodell (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-30T07:15:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d929addb829b92d650ef6caecb267fb154f6f9f7d28be7aa87851569931f5228
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

# OpenClaw-Bedrohungsmodell v1.0

## MITRE-ATLAS-Framework

**Version:** 1.0-Entwurf
**Zuletzt aktualisiert:** 2026-02-04
**Methodik:** MITRE ATLAS + Datenflussdiagramme
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Framework-Attribution

Dieses Bedrohungsmodell basiert auf [MITRE ATLAS](https://atlas.mitre.org/), dem Branchenstandard-Framework zur Dokumentation adversarialer Bedrohungen für KI/ML-Systeme. ATLAS wird von [MITRE](https://www.mitre.org/) in Zusammenarbeit mit der KI-Sicherheitscommunity gepflegt.

**Wichtige ATLAS-Ressourcen:**

- [ATLAS-Techniken](https://atlas.mitre.org/techniques/)
- [ATLAS-Taktiken](https://atlas.mitre.org/tactics/)
- [ATLAS-Fallstudien](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Zu ATLAS beitragen](https://atlas.mitre.org/resources/contribute)

### Zu diesem Bedrohungsmodell beitragen

Dies ist ein fortlaufend gepflegtes Dokument der OpenClaw-Community. Richtlinien für Beiträge finden Sie unter [CONTRIBUTING-THREAT-MODEL.md](/de/security/CONTRIBUTING-THREAT-MODEL):

- Neue Bedrohungen melden
- Bestehende Bedrohungen aktualisieren
- Angriffsketten vorschlagen
- Minderungsmaßnahmen vorschlagen

---

## 1. Einführung

### 1.1 Zweck

Dieses Bedrohungsmodell dokumentiert adversariale Bedrohungen für die OpenClaw-KI-Agent-Plattform und den ClawHub-Skill-Marktplatz unter Verwendung des MITRE-ATLAS-Frameworks, das speziell für KI/ML-Systeme entwickelt wurde.

### 1.2 Umfang

| Komponente             | Enthalten | Hinweise                                         |
| ---------------------- | --------- | ------------------------------------------------ |
| OpenClaw Agent Runtime | Ja        | Kern-Agent-Ausführung, Tool-Aufrufe, Sitzungen   |
| Gateway                | Ja        | Authentifizierung, Routing, Kanalintegration     |
| Kanalintegrationen     | Ja        | WhatsApp, Telegram, Discord, Signal, Slack usw.  |
| ClawHub-Marktplatz     | Ja        | Veröffentlichung von Skills, Moderation, Verteilung |
| MCP-Server             | Ja        | Externe Tool-Provider                            |
| Benutzergeräte         | Teilweise | Mobile Apps, Desktop-Clients                     |

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

| Fluss | Quelle  | Ziel        | Daten              | Schutz                  |
| ----- | ------- | ----------- | ------------------ | ----------------------- |
| F1    | Kanal   | Gateway     | Benutzernachrichten | TLS, AllowFrom          |
| F2    | Gateway | Agent       | Geroutete Nachrichten | Sitzungsisolierung    |
| F3    | Agent   | Tools       | Tool-Aufrufe       | Richtliniendurchsetzung |
| F4    | Agent   | Extern      | web_fetch-Anfragen | SSRF-Blockierung        |
| F5    | ClawHub | Agent       | Skill-Code         | Moderation, Scanning    |
| F6    | Agent   | Kanal       | Antworten          | Ausgabefilterung        |

---

## 3. Bedrohungsanalyse nach ATLAS-Taktik

### 3.1 Aufklärung (AML.TA0002)

#### T-RECON-001: Erkennung von Agent-Endpunkten

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Aktives Scanning                                         |
| **Beschreibung**        | Angreifer scannt nach exponierten OpenClaw-Gateway-Endpunkten        |
| **Angriffsvektor**      | Netzwerk-Scanning, Shodan-Abfragen, DNS-Enumeration                  |
| **Betroffene Komponenten** | Gateway, exponierte API-Endpunkte                                 |
| **Aktuelle Minderungen** | Tailscale-Auth-Option, standardmäßig Bindung an loopback            |
| **Restrisiko**          | Mittel - Öffentliche Gateways sind auffindbar                        |
| **Empfehlungen**        | Sichere Bereitstellung dokumentieren, Rate Limiting für Discovery-Endpunkte hinzufügen |

#### T-RECON-002: Sondierung von Kanalintegrationen

| Attribut                | Wert                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0006 - Aktives Scannen                                        |
| **Beschreibung**        | Angreifer sondiert Messaging-Kanäle, um KI-verwaltete Konten zu identifizieren |
| **Angriffsvektor**      | Senden von Testnachrichten, Beobachten von Antwortmustern          |
| **Betroffene Komponenten** | Alle Kanalintegrationen                                         |
| **Aktuelle Gegenmaßnahmen** | Keine spezifischen                                             |
| **Restrisiko**          | Niedrig - Begrenzter Nutzen allein durch Erkennung                 |
| **Empfehlungen**        | Randomisierung des Antwortzeitpunkts erwägen                       |

---

### 3.2 Initialer Zugriff (AML.TA0004)

#### T-ACCESS-001: Abfangen des Kopplungscodes

| Attribut                | Wert                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf KI-Modell-Inferenz-API                                                               |
| **Beschreibung**        | Angreifer fängt den Kopplungscode während der Kopplungsfrist ab (1 h für DM-Kanalkopplung, 5 m für Node-Kopplung) |
| **Angriffsvektor**      | Shoulder Surfing, Netzwerk-Sniffing, Social Engineering                                                       |
| **Betroffene Komponenten** | Gerätekopplungssystem                                                                                     |
| **Aktuelle Gegenmaßnahmen** | 1 h Ablaufzeit (DM-Kopplung) / 5 m Ablaufzeit (Node-Kopplung), Codes über bestehenden Kanal gesendet      |
| **Restrisiko**          | Mittel - Kopplungsfrist ausnutzbar                                                                           |
| **Empfehlungen**        | Kopplungsfrist reduzieren, Bestätigungsschritt hinzufügen                                                     |

#### T-ACCESS-002: AllowFrom-Spoofing

| Attribut                | Wert                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf KI-Modell-Inferenz-API                                |
| **Beschreibung**        | Angreifer fälscht die Identität eines zulässigen Absenders im Kanal            |
| **Angriffsvektor**      | Kanalabhängig - Telefonnummern-Spoofing, Nachahmung von Benutzernamen          |
| **Betroffene Komponenten** | AllowFrom-Validierung pro Kanal                                             |
| **Aktuelle Gegenmaßnahmen** | Kanalspezifische Identitätsprüfung                                         |
| **Restrisiko**          | Mittel - Einige Kanäle sind anfällig für Spoofing                              |
| **Empfehlungen**        | Kanalspezifische Risiken dokumentieren, wo möglich kryptografische Prüfung hinzufügen |

#### T-ACCESS-003: Token-Diebstahl

| Attribut                | Wert                                                        |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf KI-Modell-Inferenz-API             |
| **Beschreibung**        | Angreifer stiehlt Authentifizierungstoken aus Konfigurationsdateien |
| **Angriffsvektor**      | Malware, unbefugter Gerätezugriff, Offenlegung von Konfigurations-Backups |
| **Betroffene Komponenten** | ~/.openclaw/credentials/, Konfigurationsspeicher        |
| **Aktuelle Gegenmaßnahmen** | Dateiberechtigungen                                     |
| **Restrisiko**          | Hoch - Token werden im Klartext gespeichert                 |
| **Empfehlungen**        | Token-Verschlüsselung im Ruhezustand implementieren, Token-Rotation hinzufügen |

---

### 3.3 Ausführung (AML.TA0005)

#### T-EXEC-001: Direkte Prompt-Injection

| Attribut                | Wert                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                                              |
| **Beschreibung**        | Angreifer sendet präparierte Prompts, um das Agent-Verhalten zu manipulieren              |
| **Angriffsvektor**      | Kanalnachrichten mit gegnerischen Anweisungen                                             |
| **Betroffene Komponenten** | Agent-LLM, alle Eingabeoberflächen                                                     |
| **Aktuelle Gegenmaßnahmen** | Mustererkennung, Einbettung externer Inhalte                                          |
| **Restrisiko**          | Kritisch - Nur Erkennung, keine Blockierung; ausgefeilte Angriffe umgehen dies            |
| **Empfehlungen**        | Mehrschichtige Verteidigung, Ausgabevalidierung und Benutzerbestätigung für sensible Aktionen implementieren |

#### T-EXEC-002: Indirekte Prompt-Injection

| Attribut                | Wert                                                        |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.001 - LLM-Prompt-Injection: Indirekt              |
| **Beschreibung**        | Angreifer bettet schädliche Anweisungen in abgerufene Inhalte ein |
| **Angriffsvektor**      | Schädliche URLs, vergiftete E-Mails, kompromittierte Webhooks |
| **Betroffene Komponenten** | web_fetch, E-Mail-Aufnahme, externe Datenquellen         |
| **Aktuelle Gegenmaßnahmen** | Inhaltseinbettung mit XML-Tags und Sicherheitshinweis   |
| **Restrisiko**          | Hoch - LLM kann Wrapper-Anweisungen ignorieren              |
| **Empfehlungen**        | Inhaltsbereinigung und getrennte Ausführungskontexte implementieren |

#### T-EXEC-003: Tool-Argument-Injection

| Attribut                | Wert                                                         |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                 |
| **Beschreibung**        | Angreifer manipuliert Tool-Argumente durch Prompt-Injection  |
| **Angriffsvektor**      | Präparierte Prompts, die Tool-Parameterwerte beeinflussen    |
| **Betroffene Komponenten** | Alle Tool-Aufrufe                                         |
| **Aktuelle Gegenmaßnahmen** | Exec-Genehmigungen für gefährliche Befehle               |
| **Restrisiko**          | Hoch - Beruht auf dem Urteilsvermögen der Benutzer           |
| **Empfehlungen**        | Argumentvalidierung und parametrisierte Tool-Aufrufe implementieren |

#### T-EXEC-004: Umgehung der Exec-Genehmigung

| Attribut                | Wert                                                       |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Erstellen gegnerischer Daten                   |
| **Beschreibung**        | Angreifer erstellt Befehle, die die Genehmigungs-Allowlist umgehen |
| **Angriffsvektor**      | Befehlsverschleierung, Ausnutzung von Aliasen, Pfadmanipulation |
| **Betroffene Komponenten** | exec-approvals.ts, Befehls-Allowlist                    |
| **Aktuelle Gegenmaßnahmen** | Allowlist + Nachfragemodus                             |
| **Restrisiko**          | Hoch - Keine Befehlsbereinigung                            |
| **Empfehlungen**        | Befehlsnormalisierung implementieren, Blocklist erweitern   |

---

### 3.4 Persistenz (AML.TA0006)

#### T-PERSIST-001: Installation eines schädlichen Skills

| Attribut                | Wert                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0010.001 - Kompromittierung der Lieferkette: KI-Software            |
| **Beschreibung**        | Angreifer veröffentlicht schädlichen Skill in ClawHub                    |
| **Angriffsvektor**      | Konto erstellen, Skill mit verborgenem schädlichem Code veröffentlichen |
| **Betroffene Komponenten** | ClawHub, Laden von Skills, Agent-Ausführung                           |
| **Aktuelle Gegenmaßnahmen** | Prüfung des GitHub-Kontoalters, musterbasierte Moderationsmarkierungen |
| **Restrisiko**          | Kritisch - Kein Sandboxing, begrenzte Prüfung                            |
| **Empfehlungen**        | VirusTotal-Integration (in Arbeit), Skill-Sandboxing, Community-Prüfung |

#### T-PERSIST-002: Vergiftung von Skill-Updates

| Attribut                | Wert                                                           |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Kompromittierung der Lieferkette: KI-Software  |
| **Beschreibung**        | Angreifer kompromittiert beliebten Skill und verteilt schädliches Update |
| **Angriffsvektor**      | Kontokompromittierung, Social Engineering des Skill-Besitzers  |
| **Betroffene Komponenten** | ClawHub-Versionierung, automatische Update-Abläufe          |
| **Aktuelle Gegenmaßnahmen** | Versions-Fingerprinting                                   |
| **Restrisiko**          | Hoch - Automatische Updates können schädliche Versionen beziehen |
| **Empfehlungen**        | Update-Signierung, Rollback-Fähigkeit und Versions-Pinning implementieren |

#### T-PERSIST-003: Manipulation der Agent-Konfiguration

| Attribut                | Wert                                                            |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.002 - Kompromittierung der Lieferkette: Daten         |
| **Beschreibung**        | Angreifer ändert die Agent-Konfiguration, um Zugriff dauerhaft zu erhalten |
| **Angriffsvektor**      | Änderung von Konfigurationsdateien, Einschleusen von Einstellungen |
| **Betroffene Komponenten** | Agent-Konfiguration, Tool-Richtlinien                        |
| **Aktuelle Gegenmaßnahmen** | Dateiberechtigungen                                         |
| **Restrisiko**          | Mittel - Erfordert lokalen Zugriff                              |
| **Empfehlungen**        | Integritätsprüfung der Konfiguration und Audit-Protokollierung für Konfigurationsänderungen |

---

### 3.5 Umgehung von Abwehrmaßnahmen (AML.TA0007)

#### T-EVADE-001: Umgehung von Moderationsmustern

| Attribut                | Wert                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Erstellen gegnerischer Daten                               |
| **Beschreibung**        | Angreifer erstellt Skill-Inhalte, um Moderationsmuster zu umgehen      |
| **Angriffsvektor**      | Unicode-Homoglyphen, Kodierungstricks, dynamisches Laden               |
| **Betroffene Komponenten** | ClawHub moderation.ts                                               |
| **Aktuelle Gegenmaßnahmen** | Musterbasierte FLAG_RULES                                          |
| **Restrisiko**          | Hoch - Einfache Regex leicht umgehbar                                  |
| **Empfehlungen**        | Verhaltensanalyse hinzufügen (VirusTotal Code Insight), AST-basierte Erkennung |

#### T-EVADE-002: Ausbruch aus dem Content-Wrapper

| Attribut               | Wert                                                     |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Angreiferdaten erstellen                        |
| **Beschreibung**         | Angreifer erstellt Inhalte, die aus dem XML-Wrapper-Kontext ausbrechen  |
| **Angriffsvektor**       | Tag-Manipulation, Kontextverwirrung, Überschreiben von Anweisungen |
| **Betroffene Komponenten** | Wrapping externer Inhalte                                 |
| **Aktuelle Schutzmaßnahmen** | XML-Tags + Sicherheitshinweis                                |
| **Restrisiko**       | Mittel - Neue Ausbrüche werden regelmäßig entdeckt               |
| **Empfehlungen**     | Mehrere Wrapper-Schichten, ausgabeseitige Validierung           |

---

### 3.6 Discovery (AML.TA0008)

#### T-DISC-001: Tool-Aufzählung

| Attribut               | Wert                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die AI Model Inference API             |
| **Beschreibung**         | Angreifer zählt verfügbare Tools durch Prompting auf |
| **Angriffsvektor**       | Abfragen im Stil von „Welche Tools haben Sie?“               |
| **Betroffene Komponenten** | Tool-Registry des Agenten                                   |
| **Aktuelle Schutzmaßnahmen** | Keine spezifischen                                         |
| **Restrisiko**       | Niedrig - Tools sind im Allgemeinen dokumentiert                      |
| **Empfehlungen**     | Sichtbarkeitskontrollen für Tools erwägen                     |

#### T-DISC-002: Extraktion von Sitzungsdaten

| Attribut               | Wert                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die AI Model Inference API             |
| **Beschreibung**         | Angreifer extrahiert sensible Daten aus dem Sitzungskontext |
| **Angriffsvektor**       | Abfragen wie „Was haben wir besprochen?“, Kontextsondierung       |
| **Betroffene Komponenten** | Sitzungstranskripte, Kontextfenster                   |
| **Aktuelle Schutzmaßnahmen** | Sitzungsisolierung pro Absender                          |
| **Restrisiko**       | Mittel - Daten innerhalb der Sitzung sind zugänglich               |
| **Empfehlungen**     | Schwärzung sensibler Daten im Kontext implementieren         |

---

### 3.7 Sammlung & Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Datendiebstahl über web_fetch

| Attribut               | Wert                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                 |
| **Beschreibung**         | Angreifer exfiltriert Daten, indem er den Agenten anweist, sie an eine externe URL zu senden |
| **Angriffsvektor**       | Prompt-Injection, die den Agenten veranlasst, Daten per POST an den Server des Angreifers zu senden         |
| **Betroffene Komponenten** | web_fetch-Tool                                                         |
| **Aktuelle Schutzmaßnahmen** | SSRF-Blockierung für interne Netzwerke                                    |
| **Restrisiko**       | Hoch - Externe URLs sind erlaubt                                         |
| **Empfehlungen**     | URL-Allowlisting und Bewusstsein für Datenklassifizierung implementieren              |

#### T-EXFIL-002: Unbefugtes Senden von Nachrichten

| Attribut               | Wert                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                           |
| **Beschreibung**         | Angreifer veranlasst den Agenten, Nachrichten mit sensiblen Daten zu senden |
| **Angriffsvektor**       | Prompt-Injection, die den Agenten veranlasst, dem Angreifer eine Nachricht zu senden               |
| **Betroffene Komponenten** | Nachrichten-Tool, Kanalintegrationen                               |
| **Aktuelle Schutzmaßnahmen** | Gating ausgehender Nachrichten                                        |
| **Restrisiko**       | Mittel - Gating kann umgangen werden                                  |
| **Empfehlungen**     | Explizite Bestätigung für neue Empfänger verlangen                 |

#### T-EXFIL-003: Abgreifen von Zugangsdaten

| Attribut               | Wert                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                  |
| **Beschreibung**         | Bösartiger Skill greift Zugangsdaten aus dem Agentenkontext ab |
| **Angriffsvektor**       | Skill-Code liest Umgebungsvariablen und Konfigurationsdateien    |
| **Betroffene Komponenten** | Ausführungsumgebung für Skills                             |
| **Aktuelle Schutzmaßnahmen** | Keine spezifisch für Skills                                 |
| **Restrisiko**       | Kritisch - Skills werden mit Agentenberechtigungen ausgeführt             |
| **Empfehlungen**     | Skill-Sandboxing, Isolierung von Zugangsdaten                  |

---

### 3.8 Auswirkungen (AML.TA0011)

#### T-IMPACT-001: Unbefugte Befehlsausführung

| Attribut               | Wert                                               |
| ----------------------- | --------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Integrität des KI-Modells untergraben                |
| **Beschreibung**         | Angreifer führt beliebige Befehle auf dem System des Benutzers aus |
| **Angriffsvektor**       | Prompt-Injection kombiniert mit Umgehung der Exec-Genehmigung |
| **Betroffene Komponenten** | Bash-Tool, Befehlsausführung                        |
| **Aktuelle Schutzmaßnahmen** | Exec-Genehmigungen, Docker-Sandbox-Option               |
| **Restrisiko**       | Kritisch - Host-Ausführung ohne Sandbox           |
| **Empfehlungen**     | Sandbox als Standard verwenden, Genehmigungs-UX verbessern             |

#### T-IMPACT-002: Ressourcenerschöpfung (DoS)

| Attribut               | Wert                                              |
| ----------------------- | -------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Integrität des KI-Modells untergraben               |
| **Beschreibung**         | Angreifer erschöpft API-Guthaben oder Rechenressourcen |
| **Angriffsvektor**       | Automatisierte Nachrichtenflut, teure Tool-Aufrufe   |
| **Betroffene Komponenten** | Gateway, Agentensitzungen, API-Provider              |
| **Aktuelle Schutzmaßnahmen** | Keine                                               |
| **Restrisiko**       | Hoch - Keine Ratenbegrenzung                            |
| **Empfehlungen**     | Ratenbegrenzungen pro Absender und Kostenbudgets implementieren     |

#### T-IMPACT-003: Reputationsschaden

| Attribut               | Wert                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Integrität des KI-Modells untergraben                    |
| **Beschreibung**         | Angreifer veranlasst den Agenten, schädliche/anstößige Inhalte zu senden |
| **Angriffsvektor**       | Prompt-Injection, die unangemessene Antworten verursacht        |
| **Betroffene Komponenten** | Ausgabegenerierung, Kanalnachrichten                    |
| **Aktuelle Schutzmaßnahmen** | Inhaltsrichtlinien des LLM-Providers                           |
| **Restrisiko**       | Mittel - Provider-Filter sind unvollkommen                     |
| **Empfehlungen**     | Ausgabefilterschicht, Benutzerkontrollen                   |

---

## 4. Analyse der ClawHub-Lieferkette

### 4.1 Aktuelle Sicherheitskontrollen

| Kontrolle              | Implementierung              | Wirksamkeit                                        |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| Alter des GitHub-Kontos   | `requireGitHubAccountAge()` | Mittel - Erhöht die Hürde für neue Angreifer                |
| Pfadbereinigung    | `sanitizePath()`            | Hoch - Verhindert Path Traversal                       |
| Dateitypvalidierung | `isTextFile()`              | Mittel - Nur Textdateien, können aber dennoch bösartig sein |
| Größenbeschränkungen          | 50 MB Gesamt-Bundle           | Hoch - Verhindert Ressourcenerschöpfung                  |
| Erforderliche SKILL.md    | Obligatorische Readme            | Geringer Sicherheitswert - Nur informativ              |
| Muster-Moderation   | FLAG_RULES in moderation.ts | Niedrig - Leicht zu umgehen                                |
| Moderationsstatus    | Feld `moderationStatus`    | Mittel - Manuelle Überprüfung möglich                      |

### 4.2 Muster für Moderations-Flags

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
- Analysiert den tatsächlichen Skill-Code-Inhalt nicht
- Einfache Regex kann durch Verschleierung leicht umgangen werden
- Keine Verhaltensanalyse

### 4.3 Geplante Verbesserungen

| Verbesserung            | Status                                | Auswirkung                                                                |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| VirusTotal-Integration | In Arbeit                           | Hoch - Verhaltensanalyse durch Code Insight                               |
| Community-Meldungen    | Teilweise (`skillReports`-Tabelle vorhanden) | Mittel                                                                |
| Audit-Protokollierung          | Teilweise (`auditLogs`-Tabelle vorhanden)    | Mittel                                                                |
| Badge-System           | Implementiert                           | Mittel - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risikomatrix

### 5.1 Wahrscheinlichkeit vs. Auswirkung

| Bedrohungs-ID     | Wahrscheinlichkeit | Auswirkung   | Risikostufe   | Priorität |
| ------------- | ---------- | -------- | ------------ | -------- |
| T-EXEC-001    | Hoch       | Kritisch | **Kritisch** | P0       |
| T-PERSIST-001 | Hoch       | Kritisch | **Kritisch** | P0       |
| T-EXFIL-003   | Mittel     | Kritisch | **Kritisch** | P0       |
| T-IMPACT-001  | Mittel     | Kritisch | **Hoch**     | P1       |
| T-EXEC-002    | Hoch       | Hoch     | **Hoch**     | P1       |
| T-EXEC-004    | Mittel     | Hoch     | **Hoch**     | P1       |
| T-ACCESS-003  | Mittel     | Hoch     | **Hoch**     | P1       |
| T-EXFIL-001   | Mittel     | Hoch     | **Hoch**     | P1       |
| T-IMPACT-002  | Hoch       | Mittel   | **Hoch**     | P1       |
| T-EVADE-001   | Hoch       | Mittel   | **Mittel**   | P2       |
| T-ACCESS-001  | Niedrig        | Hoch     | **Mittel**   | P2       |
| T-ACCESS-002  | Niedrig        | Hoch     | **Mittel**   | P2       |
| T-PERSIST-002 | Niedrig        | Hoch     | **Mittel**   | P2       |

### 5.2 Angriffsketten auf dem kritischen Pfad

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

| ID    | Empfehlung                              | Adressiert                 |
| ----- | --------------------------------------- | -------------------------- |
| R-001 | VirusTotal-Integration abschließen      | T-PERSIST-001, T-EVADE-001 |
| R-002 | Skill-Sandboxing implementieren         | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Ausgabevalidierung für sensible Aktionen hinzufügen | T-EXEC-001, T-EXEC-002     |

### 6.2 Kurzfristig (P1)

| ID    | Empfehlung                           | Adressiert   |
| ----- | ------------------------------------ | ------------ |
| R-004 | Ratenbegrenzung implementieren       | T-IMPACT-002 |
| R-005 | Token-Verschlüsselung im Ruhezustand hinzufügen | T-ACCESS-003 |
| R-006 | UX und Validierung für exec-Genehmigungen verbessern | T-EXEC-004   |
| R-007 | URL-Allowlisting für web_fetch implementieren | T-EXFIL-001  |

### 6.3 Mittelfristig (P2)

| ID    | Empfehlung                                        | Adressiert    |
| ----- | ------------------------------------------------- | ------------- |
| R-008 | Kryptografische Kanalverifizierung hinzufügen, wo möglich | T-ACCESS-002  |
| R-009 | Verifizierung der Konfigurationsintegrität implementieren | T-PERSIST-003 |
| R-010 | Update-Signierung und Versions-Pinning hinzufügen | T-PERSIST-002 |

---

## 7. Anhänge

### 7.1 ATLAS-Technikzuordnung

| ATLAS-ID      | Technikname                    | OpenClaw-Bedrohungen                                            |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Aktives Scanning               | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Sammlung                       | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Lieferkette: KI-Software       | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Lieferkette: Daten             | T-PERSIST-003                                                    |
| AML.T0031     | KI-Modellintegrität untergraben | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Zugriff auf KI-Modell-Inferenz-API | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Angreiferdaten erstellen       | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM-Prompt-Injection: direkt   | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM-Prompt-Injection: indirekt | T-EXEC-002                                                       |

### 7.2 Wichtige Sicherheitsdateien

| Pfad                                | Zweck                       | Risikostufe  |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logik für Befehlsfreigaben  | **Kritisch** |
| `src/gateway/auth.ts`               | Gateway-Authentifizierung   | **Kritisch** |
| `src/infra/net/ssrf.ts`             | SSRF-Schutz                 | **Kritisch** |
| `src/security/external-content.ts`  | Minderung von Prompt-Injection | **Kritisch** |
| `src/agents/sandbox/tool-policy.ts` | Durchsetzung der Tool-Richtlinie | **Kritisch** |
| `src/routing/resolve-route.ts`      | Sitzungsisolation           | **Mittel**   |

### 7.3 Glossar

| Begriff              | Definition                                                |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | MITREs Adversarial Threat Landscape for AI Systems        |
| **ClawHub**          | Skill-Marktplatz von OpenClaw                             |
| **Gateway**          | Nachrichtenrouting- und Authentifizierungsschicht von OpenClaw |
| **MCP**              | Model Context Protocol - Schnittstelle für Tool-Provider  |
| **Prompt Injection** | Angriff, bei dem bösartige Anweisungen in Eingaben eingebettet werden |
| **Skill**            | Herunterladbare Erweiterung für OpenClaw-Agenten          |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Dieses Bedrohungsmodell ist ein lebendes Dokument. Melden Sie Sicherheitsprobleme an security@openclaw.ai_

## Verwandt

- [Formale Verifizierung](/de/security/formal-verification)
- [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
