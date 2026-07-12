---
read_when:
    - Überprüfung der Sicherheitslage oder von Bedrohungsszenarien
    - Arbeiten an Sicherheitsfunktionen oder Audit-Antworten
summary: OpenClaw-Bedrohungsmodell, zugeordnet zum MITRE-ATLAS-Framework
title: Bedrohungsmodell (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T02:10:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Version:** 1.0-Entwurf | **Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Bedrohungslandschaft durch Angriffe auf KI-Systeme) + Datenflussdiagramme

Dieses Bedrohungsmodell dokumentiert gegnerische Bedrohungen für die KI-Agentenplattform OpenClaw und den Skills-Marktplatz ClawHub. Es ist ein fortlaufend aktualisiertes Dokument, das von der OpenClaw-Community gepflegt wird. Unter [Mitwirkung am Bedrohungsmodell](/de/security/CONTRIBUTING-THREAT-MODEL) erfahren Sie, wie Sie neue Bedrohungen melden, Angriffsketten vorschlagen oder Gegenmaßnahmen empfehlen können.

**Wichtige ATLAS-Ressourcen:** [Techniken](https://atlas.mitre.org/techniques/) | [Taktiken](https://atlas.mitre.org/tactics/) | [Fallstudien](https://atlas.mitre.org/studies/) | [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data) | [Mitwirkung an ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Geltungsbereich

| Komponente                    | Enthalten   | Hinweise                                            |
| ---------------------------- | ----------- | --------------------------------------------------- |
| OpenClaw-Agentenlaufzeit     | Ja          | Kernausführung des Agenten, Tool-Aufrufe, Sitzungen |
| Gateway                      | Ja          | Authentifizierung, Routing, Kanalintegration        |
| Kanalintegrationen           | Ja          | WhatsApp, Telegram, Discord, Signal, Slack usw.     |
| ClawHub-Marktplatz           | Ja          | Veröffentlichung, Moderation und Verteilung von Skills |
| MCP-Server                   | Ja          | Externe Tool-Provider                               |
| Benutzergeräte               | Teilweise   | Mobile Apps, Desktop-Clients                        |

Nicht berücksichtigte Meldungen und typische falsch positive Befunde (öffentliche Erreichbarkeit über das Internet, reine Prompt-Injection-Ketten ohne Umgehung einer Sicherheitsgrenze, gegenseitig nicht vertrauenswürdige Betreiber auf demselben Gateway-Host und weitere) sind in [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) aufgeführt. Diese Datei ist die aktuelle maßgebliche Quelle für den Geltungsbereich von Schwachstellenmeldungen, nicht diese Seite.

## 2. Systemarchitektur

### 2.1 Vertrauensgrenzen

```text
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
│  │  • Device pairing (1h DM pairing / 5m node pairing TTL)   │   │
│  │  • AllowFrom / allowlist validation                       │   │
│  │  • Token / password / Tailscale auth                      │   │
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
│  │  • Docker sandbox (default) or host (exec approvals)      │   │
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
│  │  • External content wrapping (random-boundary XML tags)   │   │
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
│  │  • Static pattern + AST-adjacent moderation scanning      │   │
│  │  • LLM-based agentic risk review + VirusTotal scanning    │   │
│  │  • GitHub account age verification (14 days)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Datenflüsse

| Fluss | Quelle  | Ziel       | Daten                | Schutzmaßnahmen          |
| ----- | ------- | ---------- | -------------------- | ------------------------ |
| F1    | Kanal   | Gateway    | Benutzernachrichten  | TLS, AllowFrom           |
| F2    | Gateway | Agent      | Weitergeleitete Nachrichten | Sitzungsisolierung |
| F3    | Agent   | Tools      | Tool-Aufrufe         | Richtliniendurchsetzung  |
| F4    | Agent   | Extern     | `web_fetch`-Anfragen | SSRF-Blockierung         |
| F5    | ClawHub | Agent      | Skill-Code           | Moderation, Überprüfung  |
| F6    | Agent   | Kanal      | Antworten            | Ausgabefilterung         |

---

## 3. Bedrohungsanalyse nach ATLAS-Taktik

### 3.1 Aufklärung (AML.TA0002)

#### T-RECON-001: Erkennung von Agenten-Endpunkten

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 – Aktives Scannen                                          |
| **Beschreibung**        | Ein Angreifer sucht nach offengelegten OpenClaw-Gateway-Endpunkten   |
| **Angriffsvektor**      | Netzwerkscans, Shodan-Abfragen, DNS-Aufzählung                       |
| **Betroffene Komponenten** | Gateway, offengelegte API-Endpunkte                               |
| **Aktuelle Gegenmaßnahmen** | Tailscale-Authentifizierungsoption, standardmäßige Bindung an local loopback |
| **Restrisiko**          | Mittel – öffentliche Gateways sind auffindbar                        |
| **Empfehlungen**        | Sichere Bereitstellung dokumentieren, Ratenbegrenzung für Erkennungsendpunkte hinzufügen |

#### T-RECON-002: Prüfung von Kanalintegrationen

| Attribut                | Wert                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0006 – Aktives Scannen                                        |
| **Beschreibung**        | Ein Angreifer prüft Messaging-Kanäle, um KI-verwaltete Konten zu identifizieren |
| **Angriffsvektor**      | Senden von Testnachrichten, Beobachten von Antwortmustern           |
| **Betroffene Komponenten** | Alle Kanalintegrationen                                         |
| **Aktuelle Gegenmaßnahmen** | Keine spezifischen                                              |
| **Restrisiko**          | Niedrig – begrenzter Nutzen allein durch die Erkennung              |
| **Empfehlungen**        | Zufällige Variation der Antwortzeiten in Betracht ziehen           |

---

### 3.2 Erstzugriff (AML.TA0004)

#### T-ACCESS-001: Abfangen des Kopplungscodes

| Attribut                | Wert                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                                                                        |
| **Beschreibung**        | Ein Angreifer fängt während des Kopplungsfensters einen Kopplungscode ab (1 Std. bei DM/allgemeiner Kopplung, 5 Min. bei Node-Kopplung) |
| **Angriffsvektor**      | Ausspähen über die Schulter, Netzwerk-Sniffing, Social Engineering                                                               |
| **Betroffene Komponenten** | Gerätekopplungssystem                                                                                                         |
| **Aktuelle Schutzmaßnahmen** | 1 Std. TTL (DM/allgemeine Kopplung), 5 Min. TTL (Node-Kopplung); Codes werden über den bestehenden Kanal gesendet           |
| **Restrisiko**          | Mittel – Kopplungsfenster kann ausgenutzt werden                                                                                 |
| **Empfehlungen**        | Kopplungsfenster verkürzen, Bestätigungsschritt hinzufügen                                                                       |

#### T-ACCESS-002: AllowFrom-Spoofing

| Attribut                | Wert                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                                  |
| **Beschreibung**        | Ein Angreifer täuscht in einem Kanal die Identität eines zulässigen Absenders vor          |
| **Angriffsvektor**      | Kanalabhängig – Fälschung von Telefonnummern, Identitätsvortäuschung über Benutzernamen     |
| **Betroffene Komponenten** | Kanalbezogene `AllowFrom`-Validierung                                                   |
| **Aktuelle Schutzmaßnahmen** | Kanalspezifische Identitätsprüfung                                                    |
| **Restrisiko**          | Mittel – einige Kanäle bleiben anfällig für Spoofing                                        |
| **Empfehlungen**        | Kanalspezifische Risiken dokumentieren, nach Möglichkeit kryptografische Verifizierung hinzufügen |

#### T-ACCESS-003: Token-Diebstahl

| Attribut                | Wert                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                     |
| **Beschreibung**        | Ein Angreifer stiehlt Authentifizierungs-Token aus Konfigurations-/Anmeldedatendateien |
| **Angriffsvektor**      | Schadsoftware, unbefugter Gerätezugriff, Offenlegung von Konfigurationssicherungen |
| **Betroffene Komponenten** | Speicherung von Kanal-/Provider-Anmeldedaten, Konfigurationsspeicherung    |
| **Aktuelle Schutzmaßnahmen** | Dateiberechtigungen                                                       |
| **Restrisiko**          | Hoch – Token werden im Klartext auf dem Datenträger gespeichert               |
| **Empfehlungen**        | Verschlüsselung ruhender Token implementieren, Token-Rotation hinzufügen      |

---

### 3.3 Ausführung (AML.TA0005)

#### T-EXEC-001: Direkte Prompt-Injection

| Attribut                | Wert                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                                                                                                                  |
| **Beschreibung**        | Ein Angreifer sendet speziell präparierte Prompts, um das Verhalten des Agenten zu manipulieren                                                               |
| **Angriffsvektor**      | Kanalnachrichten mit gegnerischen Anweisungen                                                                                                                 |
| **Betroffene Komponenten** | Agenten-LLM, alle Eingabeschnittstellen                                                                                                                    |
| **Aktuelle Schutzmaßnahmen** | Mustererkennung, Kapselung externer Inhalte; ohne Umgehung einer Sicherheitsgrenze als außerhalb des Umfangs von Schwachstellenmeldungen behandelt (siehe `SECURITY.md`) |
| **Restrisiko**          | Kritisch – nur Erkennung, keine Blockierung; ausgefeilte Angriffe umgehen sie                                                                                  |
| **Empfehlungen**        | Ausgabevalidierung und Benutzerbestätigung für sensible Aktionen, als zusätzliche Schicht über der bestehenden Erkennung                                      |

#### T-EXEC-002: Indirekte Prompt-Injection

| Attribut                | Wert                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.001 - LLM-Prompt-Injection: Indirekt                                                                                     |
| **Beschreibung**        | Ein Angreifer bettet bösartige Anweisungen in abgerufene Inhalte ein                                                              |
| **Angriffsvektor**      | Bösartige URLs, manipulierte E-Mails, kompromittierte Webhooks                                                                     |
| **Betroffene Komponenten** | `web_fetch`, E-Mail-Einlesung, externe Datenquellen                                                                             |
| **Aktuelle Schutzmaßnahmen** | Inhaltskapselung mit zufälligen Begrenzungsmarkierungen im XML-Stil, Normalisierung von Homoglyphen/Sondertoken und Sicherheitshinweis |
| **Restrisiko**          | Hoch – das LLM kann die Anweisungen der Kapselung weiterhin ignorieren                                                             |
| **Empfehlungen**        | Getrennte Ausführungskontexte für gekapselte Inhalte                                                                               |

#### T-EXEC-003: Einschleusung von Tool-Argumenten

| Attribut                | Wert                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                         |
| **Beschreibung**        | Ein Angreifer manipuliert Tool-Argumente durch Prompt-Injection      |
| **Angriffsvektor**      | Präparierte Prompts, die Werte von Tool-Parametern beeinflussen      |
| **Betroffene Komponenten** | Alle Tool-Aufrufe                                                |
| **Aktuelle Schutzmaßnahmen** | Ausführungsgenehmigungen für gefährliche Befehle                 |
| **Restrisiko**          | Hoch – beruht auf dem Urteilsvermögen des Benutzers                  |
| **Empfehlungen**        | Argumentvalidierung, parametrisierte Tool-Aufrufe                    |

#### T-EXEC-004: Umgehung der Ausführungsgenehmigung

| Attribut                | Wert                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Gegnerspezifische Daten erstellen                                                                                                                                                          |
| **Beschreibung**        | Ein Angreifer erstellt Befehle, welche die Positivliste für Genehmigungen umgehen                                                                                                                      |
| **Angriffsvektor**      | Befehlsverschleierung, Ausnutzung von Aliasen, Pfadmanipulation                                                                                                                                         |
| **Betroffene Komponenten** | `src/infra/exec-approvals*.ts`, Befehlspositivliste                                                                                                                                                 |
| **Aktuelle Schutzmaßnahmen** | Positivliste und Nachfragemodus sowie Befehlsnormalisierung (Entpacken von Dispatch-Wrappern, Erkennung von Inline-Auswertung, Analyse von Shell-Befehlsketten)                                     |
| **Restrisiko**          | Hoch – die Normalisierung schränkt Umgehungen durch Verschleierung ein, beseitigt sie jedoch nicht; reine Paritätsbefunde zwischen Ausführungspfaden gelten als Härtung, nicht als Schwachstellen (siehe `SECURITY.md`) |
| **Empfehlungen**        | Abdeckung der Befehlsnormalisierung gegen neue Verschleierungstechniken kontinuierlich erweitern                                                                                                       |

---

### 3.4 Persistenz (AML.TA0006)

#### T-PERSIST-001: Installation eines bösartigen Skills

| Attribut                | Wert                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Kompromittierung der Lieferkette: KI-Software                                                                       |
| **Beschreibung**        | Ein Angreifer veröffentlicht einen bösartigen Skill auf ClawHub                                                                     |
| **Angriffsvektor**      | Konto erstellen, Skill mit verborgenem bösartigem Code veröffentlichen                                                              |
| **Betroffene Komponenten** | ClawHub, Laden von Skills, Agentenausführung                                                                                      |
| **Aktuelle Schutzmaßnahmen** | Prüfung des Alters des GitHub-Kontos, statische Musterprüfung/AST-nahe Analyse, LLM-basierte agentische Risikoprüfung, VirusTotal-Prüfung |
| **Restrisiko**          | Hoch – Erkennungsschichten sind vorhanden, Skills werden jedoch weiterhin mit Agentenberechtigungen und ohne Ausführungs-Sandbox ausgeführt |
| **Empfehlungen**        | Sandbox für die Ausführung von Skills, erweiterte Community-Prüfung                                                                 |

#### T-PERSIST-002: Manipulation eines Skill-Updates

| Attribut                | Wert                                                                              |
| ----------------------- | --------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Kompromittierung der Lieferkette: KI-Software                      |
| **Beschreibung**        | Ein Angreifer kompromittiert einen beliebten Skill und veröffentlicht ein bösartiges Update |
| **Angriffsvektor**      | Kontokompromittierung, Social Engineering gegenüber dem Eigentümer des Skills      |
| **Betroffene Komponenten** | ClawHub-Versionierung, Abläufe für automatische Updates                         |
| **Aktuelle Schutzmaßnahmen** | Versions-Fingerprinting, erneute Moderation/Prüfung bei neuen Versionen         |
| **Restrisiko**          | Hoch – automatische Updates können bösartige Versionen abrufen, bevor die Prüfung abgeschlossen ist |
| **Empfehlungen**        | Signierung von Updates, Rollback-Funktion, Festschreiben von Versionen              |

#### T-PERSIST-003: Manipulation der Agentenkonfiguration

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.002 - Kompromittierung der Lieferkette: Daten              |
| **Beschreibung**        | Angreifer verändert die Agent-Konfiguration, um den Zugriff dauerhaft aufrechtzuerhalten |
| **Angriffsvektor**      | Änderung der Konfigurationsdatei, Einschleusen von Einstellungen     |
| **Betroffene Komponenten** | Agent-Konfiguration, Tool-Richtlinien                              |
| **Aktuelle Schutzmaßnahmen** | Dateiberechtigungen                                               |
| **Restrisiko**          | Mittel – erfordert lokalen Zugriff                                   |
| **Empfehlungen**        | Überprüfung der Konfigurationsintegrität, Audit-Protokollierung von Konfigurationsänderungen |

---

### 3.5 Umgehung von Schutzmaßnahmen (AML.TA0007)

#### T-EVADE-001: Umgehung von Moderationsmustern

| Attribut                | Wert                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Erstellen adversarieller Daten                                           |
| **Beschreibung**        | Angreifer erstellt Skill-Inhalte, um die Moderationsprüfungen von ClawHub zu umgehen |
| **Angriffsvektor**      | Unicode-Homoglyphen, Kodierungstricks, dynamisches Laden                             |
| **Betroffene Komponenten** | Moderations-/Scan-Pipeline von ClawHub                                            |
| **Aktuelle Schutzmaßnahmen** | Statische Musterregeln, AST-nahe Code-Scans, LLM-Prüfung agentischer Risiken, VirusTotal |
| **Restrisiko**          | Mittel – neuartige Verschleierungen können mehrschichtige Heuristiken weiterhin umgehen |
| **Empfehlungen**        | Den Korpus aus Mustern und Verhaltensweisen fortlaufend erweitern, wenn neue Umgehungsmethoden entdeckt werden |

#### T-EVADE-002: Ausbruch aus der Inhaltskapselung

| Attribut                | Wert                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Erstellen adversarieller Daten                                                                   |
| **Beschreibung**        | Angreifer erstellt Inhalte, die aus dem Kontext der Kapselung externer Inhalte ausbrechen                    |
| **Angriffsvektor**      | Tag-Manipulation, Kontextverwechslung, Überschreiben von Anweisungen                                         |
| **Betroffene Komponenten** | Kapselung externer Inhalte                                                                                |
| **Aktuelle Schutzmaßnahmen** | XML-artige Markierungen mit zufälligen Begrenzungen und Sicherheitshinweis sowie Erkennung gefälschter Markierungen anhand von Homoglyphen und Leerraumvarianten |
| **Restrisiko**          | Mittel – neuartige Ausbruchsmethoden werden regelmäßig entdeckt                                              |
| **Empfehlungen**        | Ausgabeseitige Validierung zusätzlich zur eingabeseitigen Kapselung                                          |

---

### 3.6 Erkundung (AML.TA0008)

#### T-DISC-001: Auflistung von Tools

| Attribut                | Wert                                                  |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API des KI-Modells |
| **Beschreibung**        | Angreifer ermittelt durch Prompts die verfügbaren Tools |
| **Angriffsvektor**      | Anfragen nach dem Muster „Welche Tools haben Sie?“    |
| **Betroffene Komponenten** | Tool-Registry des Agenten                           |
| **Aktuelle Schutzmaßnahmen** | Keine spezifischen Maßnahmen                      |
| **Restrisiko**          | Niedrig – Tools sind im Allgemeinen dokumentiert      |
| **Empfehlungen**        | Kontrollen für die Sichtbarkeit von Tools erwägen     |

#### T-DISC-002: Extraktion von Sitzungsdaten

| Attribut                | Wert                                                   |
| ----------------------- | ------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API des KI-Modells |
| **Beschreibung**        | Angreifer extrahiert sensible Daten aus dem Sitzungskontext |
| **Angriffsvektor**      | Anfragen wie „Was haben wir besprochen?“, Sondierung des Kontexts |
| **Betroffene Komponenten** | Sitzungstranskripte, Kontextfenster                  |
| **Aktuelle Schutzmaßnahmen** | Sitzungsisolation pro Absender (Schlüssel `agent:channel:peer`) |
| **Restrisiko**          | Mittel – sitzungsinterne Daten sind bestimmungsgemäß zugänglich |
| **Empfehlungen**        | Schwärzung sensibler Daten im Kontext                   |

---

### 3.7 Sammlung und Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Datendiebstahl über web_fetch

| Attribut                | Wert                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                            |
| **Beschreibung**        | Angreifer exfiltriert Daten, indem er den Agenten anweist, sie an eine externe URL zu senden |
| **Angriffsvektor**      | Prompt-Injection, die den Agenten veranlasst, Daten per POST an einen Server des Angreifers zu senden |
| **Betroffene Komponenten** | Tool `web_fetch`                                                             |
| **Aktuelle Schutzmaßnahmen** | SSRF-Blockierung für interne/private Netzwerke (DNS-Pinning und IP-Blockierung) |
| **Restrisiko**          | Hoch – beliebige externe URLs bleiben zulässig                                  |
| **Empfehlungen**        | URL-Zulassungsliste, Berücksichtigung der Datenklassifizierung                  |

#### T-EXFIL-002: Unbefugter Nachrichtenversand

| Attribut                | Wert                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                |
| **Beschreibung**        | Angreifer veranlasst den Agenten, Nachrichten mit sensiblen Daten zu senden |
| **Angriffsvektor**      | Prompt-Injection, die den Agenten veranlasst, dem Angreifer eine Nachricht zu senden |
| **Betroffene Komponenten** | Nachrichten-Tool, Kanalintegrationen                             |
| **Aktuelle Schutzmaßnahmen** | Zugriffskontrolle für ausgehende Nachrichten                    |
| **Restrisiko**          | Mittel – die Zugriffskontrolle kann möglicherweise umgangen werden  |
| **Empfehlungen**        | Explizite Bestätigung bei neuen Empfängern                           |

#### T-EXFIL-003: Abgreifen von Zugangsdaten

| Attribut                | Wert                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                                                                                                   |
| **Beschreibung**        | Bösartiger Skill greift Zugangsdaten aus dem Agentenkontext ab                                                                                         |
| **Angriffsvektor**      | Skill-Code liest Umgebungsvariablen und Konfigurationsdateien                                                                                          |
| **Betroffene Komponenten** | Skill-Ausführungsumgebung                                                                                                                           |
| **Aktuelle Schutzmaßnahmen** | ClawHub-Scans nach Zugangsdatenmustern (fest codierte Geheimnisse sowie Zugriff auf Umgebungsvariablen mit Zugangsdaten in Verbindung mit Netzwerkübertragungen); keine Sandbox-Ausführung für Skills zur Laufzeit |
| **Restrisiko**          | Kritisch – Skills werden mit den Berechtigungen des Agenten ausgeführt                                                                                 |
| **Empfehlungen**        | Sandbox-Ausführung für Skills, Isolierung von Zugangsdaten                                                                                             |

---

### 3.8 Auswirkungen (AML.TA0011)

#### T-IMPACT-001: Unbefugte Befehlsausführung

| Attribut                | Wert                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Beeinträchtigung der Integrität des KI-Modells                                          |
| **Beschreibung**        | Angreifer führt beliebige Befehle auf dem System des Benutzers aus                                  |
| **Angriffsvektor**      | Prompt-Injection in Kombination mit der Umgehung der Ausführungsgenehmigung                          |
| **Betroffene Komponenten** | Bash-Tool, Befehlsausführung                                                                     |
| **Aktuelle Schutzmaßnahmen** | Ausführungsgenehmigungen, Docker-Sandbox-Option (standardmäßiges Laufzeit-Backend)               |
| **Restrisiko**          | Kritisch – die Ausführung auf dem Host ist möglich, wenn die Sandbox deaktiviert ist                 |
| **Empfehlungen**        | Benutzeroberfläche für Genehmigungen verbessern; Bereitstellungen ohne Sandbox bleiben eine bewusste Betreiberentscheidung und werden entsprechend dokumentiert |

#### T-IMPACT-002: Ressourcenerschöpfung (DoS)

| Attribut                | Wert                                               |
| ----------------------- | -------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Beeinträchtigung der Integrität des KI-Modells |
| **Beschreibung**        | Angreifer erschöpft API-Guthaben oder Rechenressourcen |
| **Angriffsvektor**      | Automatisierte Nachrichtenflut, kostspielige Tool-Aufrufe |
| **Betroffene Komponenten** | Gateway, Agentensitzungen, API-Provider          |
| **Aktuelle Schutzmaßnahmen** | Keine                                           |
| **Restrisiko**          | Hoch – keine Ratenbegrenzung pro Absender           |
| **Empfehlungen**        | Ratenbegrenzungen pro Absender, Kostenbudgets       |

#### T-IMPACT-003: Rufschädigung

| Attribut                | Wert                                                       |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Beeinträchtigung der Integrität des KI-Modells |
| **Beschreibung**        | Angreifer veranlasst den Agenten, schädliche oder anstößige Inhalte zu senden |
| **Angriffsvektor**      | Prompt-Injection, die unangemessene Antworten verursacht   |
| **Betroffene Komponenten** | Ausgabegenerierung, Kanalnachrichten                     |
| **Aktuelle Schutzmaßnahmen** | Inhaltsrichtlinien des LLM-Providers                    |
| **Restrisiko**          | Mittel – Provider-Filter sind nicht fehlerfrei              |
| **Empfehlungen**        | Ausgabefilterschicht, Benutzerkontrollen                    |

---

## 4. ClawHub-Lieferkettenanalyse

### 4.1 Aktuelle Sicherheitskontrollen

| Kontrollmaßnahme                | Implementierung                                                                        | Wirksamkeit                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Alter des GitHub-Kontos         | `requireGitHubAccountAge()` (mindestens 14 Tage)                                       | Mittel – erhöht die Einstiegshürde für neue Angreifer                         |
| Pfadbereinigung                 | `sanitizePath()`                                                                       | Hoch – verhindert Pfadtraversierung                                           |
| Dateitypvalidierung             | `isTextFile()`                                                                         | Mittel – nur Textdateien werden geprüft, sie bleiben jedoch ausnutzbar        |
| Größenbeschränkungen            | Insgesamt 50 MB pro Paket (`MAX_PUBLISH_TOTAL_BYTES`)                                  | Hoch – verhindert Ressourcenerschöpfung                                       |
| Erforderliche SKILL.md          | Verpflichtende Readme-Datei bei der Veröffentlichung                                   | Geringer Sicherheitswert – dient nur der Information                          |
| Statische und AST-nahe Prüfung  | Muster-Engine für Ausführung, Exfiltration, Zugangsdatenabgriff, Verschleierung und mehr | Mittel bis hoch – deckt viele bekannte Missbrauchsmuster ab, bleibt musterbasiert |
| LLM-basierte agentische Risikoprüfung | Durch einen Sicherheits-Prompt gesteuerte Bewertung bei der Veröffentlichung     | Mittel bis hoch – erkennt Verhaltensweisen, die statische Muster übersehen     |
| VirusTotal-Prüfung              | In Veröffentlichungs- und erneute Prüfungsvorgänge für Skills und Pakete eingebunden; durch API-Schlüssel des Betreibers gesteuert | Hoch, wenn aktiviert – Erkennung durch statische Engines |
| Moderationsstatus               | Feld `moderationStatus`                                                                | Mittel – manuelle Prüfung möglich                                              |

### 4.2 Einschränkungen der Moderation

Die statische Prüfung von ClawHub untersucht den Codeinhalt von Skills direkt (nicht nur Slug, Metadaten oder Frontmatter) und deckt gefährliche Ausführungsaufrufe, dynamische Codeausführung, das Abgreifen von Zugangsdaten, Exfiltrationsmuster, verschleierte Nutzlasten und mehr ab. Bekannte Lücken:

- Die musterbasierte Erkennung kann weiterhin durch hinreichend neuartige Verschleierung umgangen werden.
- LLM-basierte Prüfungen und VirusTotal-Prüfungen setzen voraus, dass die entsprechenden betreiberseitigen API-Schlüssel und Konfigurationen aktiviert sind.
- Keine Sandbox für die Laufzeitausführung isoliert einen Skill nach der Installation von den Berechtigungen des Agenten selbst.

### 4.3 Abzeichen

Skills und Pakete tragen von Moderatoren zugewiesene Abzeichen: `highlighted`, `official`, `deprecated`, `redactionApproved` (nur Skills). Meldungen aus der Community (`skillReports`) und die Audit-Protokollierung (`auditLogs`) unterstützen die Moderationsabläufe.

---

## 5. Risikomatrix

### 5.1 Wahrscheinlichkeit und Auswirkung

| Bedrohungs-ID | Wahrscheinlichkeit | Auswirkung | Risikostufe   | Priorität |
| ------------- | ------------------ | ---------- | ------------- | --------- |
| T-EXEC-001    | Hoch               | Kritisch   | **Kritisch**  | P0        |
| T-PERSIST-001 | Hoch               | Kritisch   | **Kritisch**  | P0        |
| T-EXFIL-003   | Mittel             | Kritisch   | **Kritisch**  | P0        |
| T-IMPACT-001  | Mittel             | Kritisch   | **Hoch**      | P1        |
| T-EXEC-002    | Hoch               | Hoch       | **Hoch**      | P1        |
| T-EXEC-004    | Mittel             | Hoch       | **Hoch**      | P1        |
| T-ACCESS-003  | Mittel             | Hoch       | **Hoch**      | P1        |
| T-EXFIL-001   | Mittel             | Hoch       | **Hoch**      | P1        |
| T-IMPACT-002  | Hoch               | Mittel     | **Hoch**      | P1        |
| T-EVADE-001   | Hoch               | Mittel     | **Mittel**    | P2        |
| T-ACCESS-001  | Niedrig            | Hoch       | **Mittel**    | P2        |
| T-ACCESS-002  | Niedrig            | Hoch       | **Mittel**    | P2        |
| T-PERSIST-002 | Niedrig            | Hoch       | **Mittel**    | P2        |

### 5.2 Angriffsketten auf kritischen Pfaden

**Kette 1: Skill-basierter Datendiebstahl**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Bösartigen Skill veröffentlichen) → (Moderation umgehen) → (Zugangsdaten abgreifen)
```

**Kette 2: Prompt-Injektion bis zur entfernten Codeausführung**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Prompt einschleusen) → (Ausführungsgenehmigung umgehen) → (Befehle ausführen)
```

**Kette 3: Indirekte Injektion über abgerufene Inhalte**

```text
T-EXEC-002 → T-EXFIL-001 → Externe Exfiltration
(URL-Inhalt manipulieren) → (Agent ruft Inhalt ab und folgt Anweisungen) → (Daten werden an Angreifer gesendet)
```

---

## 6. Zusammenfassung der Empfehlungen

### 6.1 Sofortmaßnahmen (P0)

| ID    | Empfehlung                                             | Behandelt                  |
| ----- | ------------------------------------------------------ | -------------------------- |
| R-002 | Sandbox für die Ausführung von Skills implementieren   | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Ausgabevalidierung für sensible Aktionen hinzufügen    | T-EXEC-001, T-EXEC-002     |

### 6.2 Kurzfristig (P1)

| ID    | Empfehlung                                                                    | Behandelt    |
| ----- | ----------------------------------------------------------------------------- | ------------ |
| R-004 | Ratenbegrenzung pro Absender implementieren                                   | T-IMPACT-002 |
| R-005 | Verschlüsselung gespeicherter Tokens hinzufügen                               | T-ACCESS-003 |
| R-006 | Benutzerführung für Ausführungsgenehmigungen verbessern und Befehlsnormalisierung weiter ausbauen | T-EXEC-004 |
| R-007 | Zulassungsliste für URLs in `web_fetch` implementieren                        | T-EXFIL-001  |

### 6.3 Mittelfristig (P2)

| ID    | Empfehlung                                                        | Behandelt     |
| ----- | ----------------------------------------------------------------- | ------------- |
| R-008 | Soweit möglich kryptografische Kanalverifizierung hinzufügen      | T-ACCESS-002  |
| R-009 | Integritätsprüfung der Konfiguration implementieren                | T-PERSIST-003 |
| R-010 | Updatesignierung und Versionsfixierung hinzufügen                  | T-PERSIST-002 |

---

## 7. Anhänge

### 7.1 Zuordnung zu ATLAS-Techniken

| ATLAS-ID      | Bezeichnung der Technik                      | OpenClaw-Bedrohungen                                             |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| AML.T0006     | Aktive Prüfung                               | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Sammlung                                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Lieferkette: KI-Software                     | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Lieferkette: Daten                           | T-PERSIST-003                                                    |
| AML.T0031     | Integrität des KI-Modells beeinträchtigen    | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Zugriff auf die Inferenz-API des KI-Modells  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Adversarielle Daten erstellen                | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM-Prompt-Injektion: direkt                 | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM-Prompt-Injektion: indirekt               | T-EXEC-002                                                       |

### 7.2 Wichtige Sicherheitsdateien

| Pfad                                | Zweck                                       | Risikostufe  |
| ----------------------------------- | ------------------------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logik für Ausführungsgenehmigungen          | **Kritisch** |
| `src/gateway/auth.ts`               | Gateway-Authentifizierung                   | **Kritisch** |
| `src/infra/net/ssrf.ts`             | SSRF-Schutz                                 | **Kritisch** |
| `src/security/external-content.ts`  | Abwehr von Prompt-Injektionen               | **Kritisch** |
| `src/agents/sandbox/tool-policy.ts` | Zulassungs- und Sperrrichtlinie für Sandbox-Werkzeuge | **Kritisch** |
| `src/routing/resolve-route.ts`      | Sitzungsisolierung und Routing              | **Mittel**   |

### 7.3 Glossar

| Begriff              | Definition                                                            |
| -------------------- | --------------------------------------------------------------------- |
| **ATLAS**            | MITREs Bedrohungslandschaft für adversarielle Angriffe auf KI-Systeme |
| **ClawHub**          | Marktplatz von OpenClaw für Skills                                    |
| **Gateway**          | Nachrichten-Routing- und Authentifizierungsschicht von OpenClaw       |
| **MCP**              | Model Context Protocol – Schnittstelle für Werkzeug-Provider          |
| **Prompt-Injektion** | Angriff, bei dem bösartige Anweisungen in Eingaben eingebettet werden |
| **Skill**            | Herunterladbare Erweiterung für OpenClaw-Agenten                       |
| **SSRF**             | Serverseitige Anforderungsfälschung                                   |

---

_Dieses Bedrohungsmodell ist ein fortlaufend gepflegtes Dokument. Melden Sie Sicherheitsprobleme an `security@openclaw.ai` oder besuchen Sie die [Vertrauensseite](https://trust.openclaw.ai)._

## Verwandte Themen

- [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
- [Reaktion auf Sicherheitsvorfälle](/de/security/incident-response)
- [Netzwerk-Proxy](/de/security/network-proxy)
- [Formale Verifikation](/de/security/formal-verification)
