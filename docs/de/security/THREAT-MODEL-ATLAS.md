---
read_when:
    - Überprüfung der Sicherheitslage oder von Bedrohungsszenarien
    - Arbeit an Sicherheitsfunktionen oder Reaktionen auf Audits
summary: OpenClaw-Bedrohungsmodell, abgebildet auf das MITRE-ATLAS-Framework
title: Bedrohungsmodell (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-24T04:07:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Version:** 1.0-Entwurf | **Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Bedrohungslandschaft durch Angriffe auf KI-Systeme) + Datenflussdiagramme

Dieses Bedrohungsmodell dokumentiert adversarielle Bedrohungen für die KI-Agentenplattform OpenClaw und den Skill-Marktplatz ClawHub. Es ist ein fortlaufend aktualisiertes Dokument, das von der OpenClaw-Community gepflegt wird. Unter [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL) erfahren Sie, wie Sie neue Bedrohungen melden, Angriffsketten vorschlagen oder Schutzmaßnahmen empfehlen können.

**Wichtige ATLAS-Ressourcen:** [Techniken](https://atlas.mitre.org/techniques/) | [Taktiken](https://atlas.mitre.org/tactics/) | [Fallstudien](https://atlas.mitre.org/studies/) | [ATLAS auf GitHub](https://github.com/mitre-atlas/atlas-data) | [Zu ATLAS beitragen](https://atlas.mitre.org/resources/contribute)

---

## 1. Umfang

| Komponente                 | Enthalten | Hinweise                                               |
| -------------------------- | --------- | ------------------------------------------------------ |
| OpenClaw-Agentenlaufzeit   | Ja        | Agentenausführung im Kern, Tool-Aufrufe, Sitzungen      |
| Gateway                    | Ja        | Authentifizierung, Routing, Kanalintegration            |
| Kanalintegrationen         | Ja        | WhatsApp, Telegram, Discord, Signal, Slack usw.         |
| ClawHub-Marktplatz         | Ja        | Veröffentlichung, Moderation und Verteilung von Skills |
| MCP-Server                 | Ja        | Externe Tool-Provider                                  |
| Benutzergeräte             | Teilweise | Mobile Apps, Desktop-Clients                           |

Nicht abgedeckte Meldungen und Muster für Fehlalarme (öffentliche Erreichbarkeit über das Internet, reine Prompt-Injection-Ketten ohne Umgehung einer Grenze, einander nicht vertrauende Betreiber, die sich einen Gateway-Host teilen, und weitere) sind in [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) aufgeführt. Diese Datei ist die aktuelle maßgebliche Quelle für den Umfang von Schwachstellenmeldungen, nicht diese Seite.

## 2. Systemarchitektur

### 2.1 Vertrauensgrenzen

```text
┌─────────────────────────────────────────────────────────────────┐
│                    NICHT VERTRAUENSWÜRDIGE ZONE                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 1: Kanalzugriff                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Gerätekopplung (1 Std. TTL für DM-Kopplung /           │   │
│    5 Min. für Node-Kopplung)                                 │   │
│  │  • AllowFrom-/Zulassungslistenvalidierung                 │   │
│  │  • Token-/Passwort-/Tailscale-Authentifizierung           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 2: Sitzungsisolierung          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENTENSITZUNGEN                       │   │
│  │  • Sitzungsschlüssel = agent:channel:peer                │   │
│  │  • Tool-Richtlinien pro Agent                            │   │
│  │  • Transkriptprotokollierung                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 3: Tool-Ausführung             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  AUSFÜHRUNGS-SANDBOX                     │   │
│  │  • Docker-Sandbox (Standard) oder Host                   │   │
│    (Ausführungsgenehmigungen)                               │   │
│  │  • Node-Fernausführung                                   │   │
│  │  • SSRF-Schutz (DNS-Pinning + IP-Blockierung)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 4: Externe Inhalte             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ABGERUFENE URLs / E-MAILS / WEBHOOKS        │   │
│  │  • Kapselung externer Inhalte                            │   │
│    (XML-Tags mit zufälliger Begrenzung)                      │   │
│  │  • Einfügung von Sicherheitshinweisen                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 5: Lieferkette                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Veröffentlichung von Skills (SemVer, SKILL.md          │   │
│    erforderlich)                                            │   │
│  │  • Moderationsprüfung mit statischen Mustern und          │   │
│    AST-naher Analyse                                        │   │
│  │  • LLM-basierte agentische Risikoprüfung +                │   │
│    VirusTotal-Prüfung                                       │   │
│  │  • Überprüfung des GitHub-Kontoalters (14 Tage)           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Datenflüsse

| Fluss | Quelle  | Ziel     | Daten                       | Schutz                    |
| ----- | ------- | -------- | --------------------------- | ------------------------- |
| F1    | Kanal   | Gateway  | Benutzernachrichten         | TLS, AllowFrom            |
| F2    | Gateway | Agent    | Weitergeleitete Nachrichten | Sitzungsisolierung        |
| F3    | Agent   | Tools    | Tool-Aufrufe                | Durchsetzung von Richtlinien |
| F4    | Agent   | Extern   | `web_fetch`-Anfragen | SSRF-Blockierung          |
| F5    | ClawHub | Agent    | Skill-Code                  | Moderation, Prüfung       |
| F6    | Agent   | Kanal    | Antworten                   | Ausgabefilterung          |

---

## 3. Bedrohungsanalyse nach ATLAS-Taktik

### 3.1 Aufklärung (AML.TA0002)

#### T-RECON-001: Erkennung von Agentenendpunkten

| Attribut                   | Wert                                                                      |
| -------------------------- | ------------------------------------------------------------------------- |
| **ATLAS-ID**               | AML.T0006 – Aktives Scannen                                               |
| **Beschreibung**           | Angreifer suchen nach offengelegten OpenClaw-Gateway-Endpunkten           |
| **Angriffsvektor**         | Netzwerkscans, Shodan-Abfragen, DNS-Enumeration                           |
| **Betroffene Komponenten** | Gateway, offengelegte API-Endpunkte                                       |
| **Aktuelle Schutzmaßnahmen** | Tailscale-Authentifizierungsoption, standardmäßige Bindung an Loopback  |
| **Restrisiko**             | Mittel – öffentliche Gateways sind auffindbar                             |
| **Empfehlungen**           | Sichere Bereitstellung dokumentieren, Ratenbegrenzung für Erkennungsendpunkte hinzufügen |

#### T-RECON-002: Untersuchung von Kanalintegrationen

| Attribut                   | Wert                                                                    |
| -------------------------- | ----------------------------------------------------------------------- |
| **ATLAS-ID**               | AML.T0006 – Aktives Scannen                                             |
| **Beschreibung**           | Angreifer untersuchen Nachrichtenkanäle, um KI-verwaltete Konten zu identifizieren |
| **Angriffsvektor**         | Senden von Testnachrichten, Beobachten von Antwortmustern               |
| **Betroffene Komponenten** | Alle Kanalintegrationen                                                 |
| **Aktuelle Schutzmaßnahmen** | Keine spezifischen                                                    |
| **Restrisiko**             | Niedrig – begrenzter Nutzen allein durch die Erkennung                   |
| **Empfehlungen**           | Zufällige Variation der Antwortzeiten erwägen                           |

---

### 3.2 Erstzugriff (AML.TA0004)

#### T-ACCESS-001: Abfangen des Kopplungscodes

| Attribut                | Wert                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                                                     |
| **Beschreibung**        | Angreifer fängt während des Kopplungszeitfensters einen Kopplungscode ab (1h DM/allgemeine Kopplung, 5m Node-Kopplung) |
| **Angriffsvektor**      | Ausspähen über die Schulter, Netzwerk-Sniffing, Social Engineering                                            |
| **Betroffene Komponenten** | Gerätekopplungssystem                                                                                      |
| **Aktuelle Schutzmaßnahmen** | 1h TTL (DM/allgemeine Kopplung), 5m TTL (Node-Kopplung); Codes werden über den bestehenden Kanal gesendet |
| **Restrisiko**          | Mittel - Kopplungszeitfenster kann ausgenutzt werden                                                          |
| **Empfehlungen**        | Kopplungszeitfenster verkürzen, Bestätigungsschritt hinzufügen                                                |

#### T-ACCESS-002: AllowFrom-Spoofing

| Attribut                | Wert                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                            |
| **Beschreibung**        | Angreifer täuscht in einem Kanal die Identität eines zugelassenen Absenders vor      |
| **Angriffsvektor**      | Kanalabhängig - Fälschung von Telefonnummern, Identitätsvortäuschung über Benutzernamen |
| **Betroffene Komponenten** | Kanalbezogene AllowFrom-Validierung                                                |
| **Aktuelle Schutzmaßnahmen** | Kanalspezifische Identitätsprüfung                                               |
| **Restrisiko**          | Mittel - einige Kanäle bleiben anfällig für Spoofing                                  |
| **Empfehlungen**        | Kanalspezifische Risiken dokumentieren, soweit möglich kryptografische Verifizierung hinzufügen |

#### T-ACCESS-003: Token-Diebstahl

| Attribut                | Wert                                                                          |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                     |
| **Beschreibung**        | Angreifer stiehlt Authentifizierungstoken aus Konfigurations-/Anmeldedatendateien |
| **Angriffsvektor**      | Schadsoftware, unbefugter Gerätezugriff, Offenlegung von Konfigurationssicherungen |
| **Betroffene Komponenten** | Speicherung von Kanal-/Provider-Anmeldedaten, Konfigurationsspeicherung    |
| **Aktuelle Schutzmaßnahmen** | Dateiberechtigungen                                                       |
| **Restrisiko**          | Hoch - Token werden im Klartext auf dem Datenträger gespeichert               |
| **Empfehlungen**        | Verschlüsselung ruhender Token implementieren, Token-Rotation hinzufügen      |

---

### 3.3 Ausführung (AML.TA0005)

#### T-EXEC-001: Direkte Prompt-Injection

| Attribut                | Wert                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                                                                                                           |
| **Beschreibung**        | Angreifer sendet speziell präparierte Prompts, um das Verhalten des Agenten zu manipulieren                                                            |
| **Angriffsvektor**      | Kanalnachrichten mit gegnerischen Anweisungen                                                                                                          |
| **Betroffene Komponenten** | Agenten-LLM, alle Eingabeflächen                                                                                                                    |
| **Aktuelle Schutzmaßnahmen** | Mustererkennung, Umschließung externer Inhalte; gilt ohne Umgehung einer Grenze als außerhalb des Geltungsbereichs von Schwachstellenberichten (siehe `SECURITY.md`) |
| **Restrisiko**          | Kritisch - nur Erkennung, keine Blockierung; ausgefeilte Angriffe umgehen sie                                                                          |
| **Empfehlungen**        | Ausgabevalidierung und Benutzerbestätigung für sensible Aktionen, zusätzlich zur bestehenden Erkennung                                                 |

#### T-EXEC-002: Indirekte Prompt-Injection

| Attribut                | Wert                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.001 - LLM-Prompt-Injection: Indirekt                                                                               |
| **Beschreibung**        | Angreifer bettet schädliche Anweisungen in abgerufene Inhalte ein                                                            |
| **Angriffsvektor**      | Schädliche URLs, manipulierte E-Mails, kompromittierte Webhooks                                                              |
| **Betroffene Komponenten** | `web_fetch`, E-Mail-Erfassung, externe Datenquellen                                                               |
| **Aktuelle Schutzmaßnahmen** | Umschließung von Inhalten mit XML-artigen Markierungen mit zufälligen Begrenzungen, Normalisierung von Homoglyphen/Spezialtoken und ein Sicherheitshinweis |
| **Restrisiko**          | Hoch - das LLM kann die Anweisungen der Umschließung weiterhin ignorieren                                                    |
| **Empfehlungen**        | Separate Ausführungskontexte für umschlossene Inhalte                                                                        |

#### T-EXEC-003: Einschleusung von Tool-Argumenten

| Attribut                | Wert                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                          |
| **Beschreibung**        | Angreifer manipuliert Tool-Argumente durch Prompt-Injection           |
| **Angriffsvektor**      | Speziell präparierte Prompts, die Werte von Tool-Parametern beeinflussen |
| **Betroffene Komponenten** | Alle Tool-Aufrufe                                                  |
| **Aktuelle Schutzmaßnahmen** | Ausführungsgenehmigungen für gefährliche Befehle                  |
| **Restrisiko**          | Hoch - hängt vom Urteilsvermögen des Benutzers ab                      |
| **Empfehlungen**        | Argumentvalidierung, parametrisierte Tool-Aufrufe                      |

#### T-EXEC-004: Umgehung der Ausführungsgenehmigung

| Attribut                | Wert                                                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Gegnerische Daten erstellen                                                                                                                                                      |
| **Beschreibung**        | Angreifer erstellt Befehle, welche die Genehmigungs-Zulassungsliste umgehen                                                                                                                  |
| **Angriffsvektor**      | Befehlsverschleierung, Ausnutzung von Aliasen, Pfadmanipulation                                                                                                                               |
| **Betroffene Komponenten** | `src/infra/exec-approvals*.ts`, Befehls-Zulassungsliste                                                                                                                                               |
| **Aktuelle Schutzmaßnahmen** | Zulassungsliste + Nachfragemodus sowie Befehlsnormalisierung (Entfernen von Dispatch-Wrappern, Erkennung von Inline-Auswertung, Analyse von Shell-Befehlsketten)                           |
| **Restrisiko**          | Hoch - die Normalisierung schränkt die Umgehung durch Verschleierung ein, beseitigt sie jedoch nicht; reine Paritätsbefunde zwischen Ausführungspfaden gelten als Härtung, nicht als Schwachstellen (siehe `SECURITY.md`) |
| **Empfehlungen**        | Abdeckung der Befehlsnormalisierung für neue Verschleierungstechniken kontinuierlich erweitern                                                                                               |

---

### 3.4 Persistenz (AML.TA0006)

#### T-PERSIST-001: Installation eines schädlichen Skills

| Attribut                | Wert                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Kompromittierung der Lieferkette: KI-Software                                                                    |
| **Beschreibung**        | Angreifer veröffentlicht einen schädlichen Skill auf ClawHub                                                                     |
| **Angriffsvektor**      | Konto erstellen, Skill mit verborgenem Schadcode veröffentlichen                                                                 |
| **Betroffene Komponenten** | ClawHub, Laden von Skills, Agentenausführung                                                                                  |
| **Aktuelle Schutzmaßnahmen** | Prüfung des Alters des GitHub-Kontos, statische musterbasierte/AST-nahe Analyse, LLM-basierte agentische Risikoprüfung, VirusTotal-Scan |
| **Restrisiko**          | Hoch - Erkennungsebenen sind vorhanden, aber Skills werden weiterhin mit Agentenberechtigungen und ohne Ausführungs-Sandboxing ausgeführt |
| **Empfehlungen**        | Ausführungs-Sandboxing für Skills, erweiterte Community-Prüfung                                                                  |

#### T-PERSIST-002: Manipulation einer Skill-Aktualisierung

| Attribut                | Wert                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Kompromittierung der Lieferkette: KI-Software                   |
| **Beschreibung**        | Angreifer kompromittiert einen beliebten Skill und verteilt eine schädliche Aktualisierung |
| **Angriffsvektor**      | Kontokompromittierung, Social Engineering des Skill-Eigentümers                 |
| **Betroffene Komponenten** | ClawHub-Versionierung, automatische Aktualisierungsabläufe                   |
| **Aktuelle Schutzmaßnahmen** | Versions-Fingerprinting, erneute Moderation/Analyse neuer Versionen         |
| **Restrisiko**          | Hoch - automatische Aktualisierungen können schädliche Versionen abrufen, bevor die Prüfung abgeschlossen ist |
| **Empfehlungen**        | Signierung von Aktualisierungen, Rollback-Funktion, Versionsfixierung           |

#### T-PERSIST-003: Manipulation der Agentenkonfiguration

| Attribut                 | Wert                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **ATLAS-ID**             | AML.T0010.002 - Kompromittierung der Lieferkette: Daten                                    |
| **Beschreibung**         | Angreifer verändert die Agent-Konfiguration, um den Zugriff dauerhaft aufrechtzuerhalten   |
| **Angriffsvektor**       | Änderung der Konfigurationsdatei, Einschleusen von Einstellungen                           |
| **Betroffene Komponenten** | Agent-Konfiguration, Tool-Richtlinien                                                    |
| **Aktuelle Schutzmaßnahmen** | Dateiberechtigungen                                                                    |
| **Restrisiko**           | Mittel – erfordert lokalen Zugriff                                                         |
| **Empfehlungen**         | Überprüfung der Konfigurationsintegrität, Audit-Protokollierung von Konfigurationsänderungen |

---

### 3.5 Umgehung von Schutzmaßnahmen (AML.TA0007)

#### T-EVADE-001: Umgehung von Moderationsmustern

| Attribut                 | Wert                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**             | AML.T0043 - Erstellen adversarialer Daten                                                          |
| **Beschreibung**         | Angreifer erstellt Skill-Inhalte, um die Moderationsprüfungen von ClawHub zu umgehen                |
| **Angriffsvektor**       | Unicode-Homoglyphen, Kodierungstricks, dynamisches Laden                                            |
| **Betroffene Komponenten** | Moderations-/Scan-Pipeline von ClawHub                                                           |
| **Aktuelle Schutzmaßnahmen** | Statische Musterregeln, AST-nahe Codeanalyse, LLM-Prüfung agentischer Risiken, VirusTotal       |
| **Restrisiko**           | Mittel – neuartige Verschleierungen können mehrschichtige Heuristiken weiterhin umgehen            |
| **Empfehlungen**         | Den Muster- und Verhaltenskorpus mit neu entdeckten Umgehungsmethoden kontinuierlich erweitern     |

#### T-EVADE-002: Ausbruch aus der Inhaltsumhüllung

| Attribut                 | Wert                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**             | AML.T0043 - Erstellen adversarialer Daten                                                                              |
| **Beschreibung**         | Angreifer erstellt Inhalte, die aus dem Kontext der Umhüllung externer Inhalte ausbrechen                              |
| **Angriffsvektor**       | Tag-Manipulation, Kontextverwechslung, Überschreiben von Anweisungen                                                    |
| **Betroffene Komponenten** | Umhüllung externer Inhalte                                                                                           |
| **Aktuelle Schutzmaßnahmen** | XML-artige Markierungen mit zufälligen Begrenzungen und Sicherheitshinweis sowie Erkennung gefälschter Markierungen mit Homoglyphen oder Leerraumvarianten |
| **Restrisiko**           | Mittel – neuartige Ausbruchsmöglichkeiten werden regelmäßig entdeckt                                                   |
| **Empfehlungen**         | Ausgabeseitige Validierung zusätzlich zur eingabeseitigen Umhüllung                                                     |

---

### 3.6 Erkundung (AML.TA0008)

#### T-DISC-001: Aufzählung von Tools

| Attribut                | Wert                                                        |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API des KI-Modells      |
| **Beschreibung**        | Angreifer ermittelt durch Prompts die verfügbaren Tools      |
| **Angriffsvektor**      | Abfragen im Stil von „Welche Tools stehen Ihnen zur Verfügung?“ |
| **Betroffene Komponenten** | Tool-Registry des Agenten                                |
| **Aktuelle Schutzmaßnahmen** | Keine spezifischen                                     |
| **Restrisiko**          | Niedrig – Tools sind im Allgemeinen dokumentiert             |
| **Empfehlungen**        | Sichtbarkeitskontrollen für Tools in Betracht ziehen          |

#### T-DISC-002: Extraktion von Sitzungsdaten

| Attribut                | Wert                                                          |
| ----------------------- | ------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API des KI-Modells        |
| **Beschreibung**        | Angreifer extrahiert sensible Daten aus dem Sitzungskontext    |
| **Angriffsvektor**      | Abfragen wie „Was haben wir besprochen?“, Untersuchung des Kontexts |
| **Betroffene Komponenten** | Sitzungsprotokolle, Kontextfenster                         |
| **Aktuelle Schutzmaßnahmen** | Sitzungsisolierung pro Absender (Schlüssel `agent:channel:peer`) |
| **Restrisiko**          | Mittel – Sitzungsinterne Daten sind konstruktionsbedingt zugänglich |
| **Empfehlungen**        | Schwärzung sensibler Daten im Kontext                          |

---

### 3.7 Erfassung und Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Datendiebstahl über web_fetch

| Attribut                | Wert                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                                                          |
| **Beschreibung**        | Der Angreifer schleust Daten aus, indem er den Agent anweist, sie an eine externe URL zu senden               |
| **Angriffsvektor**      | Prompt-Injection, die den Agent veranlasst, Daten per POST an einen Server des Angreifers zu senden           |
| **Betroffene Komponenten** | Tool `web_fetch`                                                                                    |
| **Aktuelle Schutzmaßnahmen** | SSRF-Blockierung für interne/private Netzwerke (DNS-Pinning + IP-Blockierung)                            |
| **Restrisiko**          | Hoch – beliebige externe URLs bleiben zulässig                                                                |
| **Empfehlungen**        | URL-Zulassungslisten, Berücksichtigung der Datenklassifizierung                                               |

#### T-EXFIL-002: Unbefugtes Senden von Nachrichten

| Attribut                | Wert                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                                  |
| **Beschreibung**        | Der Angreifer veranlasst den Agent, Nachrichten mit sensiblen Daten zu senden          |
| **Angriffsvektor**      | Prompt-Injection, die den Agent veranlasst, dem Angreifer eine Nachricht zu senden     |
| **Betroffene Komponenten** | Nachrichten-Tool, Kanalintegrationen                                                |
| **Aktuelle Schutzmaßnahmen** | Zugriffskontrolle für ausgehende Nachrichten                                      |
| **Restrisiko**          | Mittel – die Zugriffskontrolle kann möglicherweise umgangen werden                     |
| **Empfehlungen**        | Explizite Bestätigung für neue Empfänger                                               |

#### T-EXFIL-003: Abgreifen von Anmeldedaten

| Attribut                | Wert                                                                                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                                                                                                                                                             |
| **Beschreibung**        | Ein bösartiges Skill greift Anmeldedaten aus dem Kontext des Agent ab                                                                                                                                             |
| **Angriffsvektor**      | Skill-Code liest Umgebungsvariablen und Konfigurationsdateien                                                                                                                                                     |
| **Betroffene Komponenten** | Ausführungsumgebung für Skills                                                                                                                                                                                 |
| **Aktuelle Schutzmaßnahmen** | ClawHub-Scan nach Anmeldedatenmustern (fest codierte Geheimnisse, Zugriff auf Umgebungsvariablen mit Anmeldedaten in Verbindung mit Netzwerkübertragungen); keine Ausführungs-Sandbox für Skills zur Laufzeit |
| **Restrisiko**          | Kritisch – Skills werden mit den Berechtigungen des Agent ausgeführt                                                                                                                                              |
| **Empfehlungen**        | Ausführungs-Sandbox für Skills, Isolierung von Anmeldedaten                                                                                                                                                       |

---

### 3.8 Auswirkungen (AML.TA0011)

#### T-IMPACT-001: Unbefugte Befehlsausführung

| Attribut                | Wert                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Integrität des KI-Modells beeinträchtigen                                                                                               |
| **Beschreibung**        | Der Angreifer führt beliebige Befehle auf dem System des Benutzers aus                                                                              |
| **Angriffsvektor**      | Prompt-Injection in Verbindung mit der Umgehung der Ausführungsgenehmigung                                                                          |
| **Betroffene Komponenten** | Bash-Tool, Befehlsausführung                                                                                                                     |
| **Aktuelle Schutzmaßnahmen** | Ausführungsgenehmigungen, Docker-Sandbox-Option (standardmäßiges Laufzeit-Backend)                                                              |
| **Restrisiko**          | Kritisch – die Ausführung auf dem Host ist möglich, wenn die Sandbox deaktiviert ist                                                                |
| **Empfehlungen**        | Benutzerführung für Genehmigungen verbessern; Bereitstellungen mit deaktivierter Sandbox bleiben eine bewusste Betreiberentscheidung und werden entsprechend dokumentiert |

#### T-IMPACT-002: Ressourcenerschöpfung (DoS)

| Attribut                | Wert                                                         |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0031 - Integrität des KI-Modells beeinträchtigen         |
| **Beschreibung**        | Der Angreifer erschöpft API-Guthaben oder Rechenressourcen    |
| **Angriffsvektor**      | Automatisierte Nachrichtenflut, kostspielige Tool-Aufrufe     |
| **Betroffene Komponenten** | Gateway, Agent-Sitzungen, API-Provider                     |
| **Aktuelle Schutzmaßnahmen** | Keine                                                   |
| **Restrisiko**          | Hoch – keine senderspezifische Ratenbegrenzung                |
| **Empfehlungen**        | Senderspezifische Ratenbegrenzungen, Kostenbudgets            |

#### T-IMPACT-003: Rufschädigung

| Attribut                | Wert                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0031 - Integrität des KI-Modells beeinträchtigen               |
| **Beschreibung**        | Der Angreifer veranlasst den Agent, schädliche/anstößige Inhalte zu senden |
| **Angriffsvektor**      | Prompt-Injection, die unangemessene Antworten verursacht            |
| **Betroffene Komponenten** | Ausgabegenerierung, Kanalnachrichten                             |
| **Aktuelle Schutzmaßnahmen** | Inhaltsrichtlinien des LLM-Providers                          |
| **Restrisiko**          | Mittel – Provider-Filter sind unvollkommen                           |
| **Empfehlungen**        | Ausgabefilterschicht, Benutzersteuerungen                            |

---

## 4. ClawHub-Lieferkettenanalyse

### 4.1 Aktuelle Sicherheitskontrollen

| Kontrolle                      | Implementierung                                                                       | Wirksamkeit                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Alter des GitHub-Kontos        | `requireGitHubAccountAge()` (mindestens 14 Tage)                                                | Mittel – erhöht die Hürde für neue Angreifer                          |
| Pfadbereinigung                | `sanitizePath()`                                                                    | Hoch – verhindert Path Traversal                                     |
| Dateitypvalidierung            | `isTextFile()`                                                                    | Mittel – nur Textdateien werden gescannt, bleiben jedoch ausnutzbar   |
| Größenbeschränkungen           | Insgesamt 50MB pro Bundle (`MAX_PUBLISH_TOTAL_BYTES`)                                         | Hoch – verhindert Ressourcenerschöpfung                              |
| Erforderliche SKILL.md         | Obligatorische Readme-Datei bei der Veröffentlichung                                   | Geringer Sicherheitswert – nur informativ                            |
| Statisches + AST-nahes Scannen | Muster-Engine für exec, Exfiltration, Abgreifen von Anmeldedaten, Verschleierung u. a. | Mittel bis hoch – deckt viele bekannte Missbrauchsmuster ab, bleibt jedoch musterbasiert |
| LLM-basierte agentische Risikoprüfung | Durch einen Sicherheits-Prompt gesteuertes Urteil bei der Veröffentlichung      | Mittel bis hoch – erkennt Verhalten, das statische Muster übersehen   |
| VirusTotal-Scanning            | In Veröffentlichungs-/Neuscan-Abläufe für Skills und Pakete eingebunden, durch den API-Schlüssel des Betreibers freigeschaltet | Hoch, wenn aktiviert – Erkennung durch statische Engines |
| Moderationsstatus              | Feld `moderationStatus`                                                               | Mittel – manuelle Prüfung möglich                                    |

### 4.2 Einschränkungen der Moderation

Das statische Scannen von ClawHub untersucht den Codeinhalt von Skills direkt (nicht nur Slug/Metadaten/Frontmatter) und deckt gefährliche exec-Aufrufe, dynamische Codeausführung, das Abgreifen von Anmeldedaten, Exfiltrationsmuster, verschleierte Nutzlasten und mehr ab. Bekannte Lücken:

- Die musterbasierte Erkennung kann weiterhin durch hinreichend neuartige Verschleierung umgangen werden.
- LLM-basierte Prüfungen und VirusTotal-Scans hängen davon ab, dass betreiberseitige API-Schlüssel bzw. Konfigurationen aktiviert sind.
- Keine Laufzeit-Ausführungs-Sandbox isoliert einen installierten Skill von den eigenen Berechtigungen des Agenten.

### 4.3 Abzeichen

Skills und Pakete tragen von Moderatoren zugewiesene Abzeichen: `highlighted`, `official`, `deprecated`, `redactionApproved` (nur Skills). Meldungen aus der Community (`skillReports`) und Audit-Protokollierung (`auditLogs`) unterstützen die Moderationsabläufe.

---

## 5. Risikomatrix

### 5.1 Wahrscheinlichkeit und Auswirkung

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

### 5.2 Angriffsketten kritischer Pfade

**Kette 1: Skill-basierter Datendiebstahl**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Bösartigen Skill veröffentlichen) → (Moderation umgehen) → (Anmeldedaten abgreifen)
```

**Kette 2: Prompt-Injection bis zur Remotecodeausführung**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Prompt einschleusen) → (exec-Genehmigung umgehen) → (Befehle ausführen)
```

**Kette 3: Indirekte Einschleusung über abgerufene Inhalte**

```text
T-EXEC-002 → T-EXFIL-001 → Externe Exfiltration
(URL-Inhalte manipulieren) → (Agent ruft Inhalte ab und befolgt Anweisungen) → (Daten werden an Angreifer gesendet)
```

---

## 6. Zusammenfassung der Empfehlungen

### 6.1 Sofortmaßnahmen (P0)

| ID    | Empfehlung                                           | Behandelte Bedrohungen     |
| ----- | ---------------------------------------------------- | -------------------------- |
| R-002 | Sandbox für die Skill-Ausführung implementieren      | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Ausgabevalidierung für sensible Aktionen hinzufügen  | T-EXEC-001, T-EXEC-002     |

### 6.2 Kurzfristig (P1)

| ID    | Empfehlung                                                                  | Behandelte Bedrohung |
| ----- | --------------------------------------------------------------------------- | -------------------- |
| R-004 | Ratenbegrenzung pro Absender implementieren                                 | T-IMPACT-002         |
| R-005 | Verschlüsselung ruhender Token hinzufügen                                   | T-ACCESS-003         |
| R-006 | UX für exec-Genehmigungen verbessern und Befehlsnormalisierung weiter ausbauen | T-EXEC-004        |
| R-007 | URL-Zulassungsliste für `web_fetch` implementieren                   | T-EXFIL-001          |

### 6.3 Mittelfristig (P2)

| ID    | Empfehlung                                                        | Behandelte Bedrohung |
| ----- | ----------------------------------------------------------------- | -------------------- |
| R-008 | Wo möglich kryptografische Kanalverifizierung hinzufügen          | T-ACCESS-002         |
| R-009 | Integritätsprüfung der Konfiguration implementieren               | T-PERSIST-003        |
| R-010 | Signierung von Updates und Festlegung von Versionen hinzufügen    | T-PERSIST-002        |

---

## 7. Anhänge

### 7.1 Zuordnung der ATLAS-Techniken

| ATLAS-ID      | Technikname                     | OpenClaw-Bedrohungen                                              |
| ------------- | ------------------------------- | ----------------------------------------------------------------- |
| AML.T0006     | Aktives Scannen                 | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Sammlung                        | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Lieferkette: KI-Software        | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Lieferkette: Daten              | T-PERSIST-003                                                    |
| AML.T0031     | Integrität des KI-Modells beeinträchtigen | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                 |
| AML.T0040     | Zugriff auf KI-Modellinferenz-API | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Adversariale Daten erstellen    | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM-Prompt-Injection: direkt    | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM-Prompt-Injection: indirekt  | T-EXEC-002                                                       |

### 7.2 Wichtige Sicherheitsdateien

| Pfad                                | Zweck                              | Risikostufe  |
| ----------------------------------- | ---------------------------------- | ------------ |
| `src/infra/exec-approvals.ts`                  | Logik für Befehlsgenehmigungen     | **Kritisch** |
| `src/gateway/auth.ts`                  | Gateway-Authentifizierung          | **Kritisch** |
| `src/infra/net/ssrf.ts`                  | SSRF-Schutz                        | **Kritisch** |
| `src/security/external-content.ts`                  | Abwehr von Prompt-Injection        | **Kritisch** |
| `src/agents/sandbox/tool-policy.ts`                  | Zulassungs-/Sperrrichtlinie für Sandbox-Werkzeuge | **Kritisch** |
| `src/routing/resolve-route.ts`                  | Sitzungsisolierung/-Routing        | **Mittel**   |

### 7.3 Glossar

| Begriff              | Definition                                                       |
| -------------------- | ---------------------------------------------------------------- |
| **ATLAS**            | MITREs Bedrohungslandschaft für adversariale Angriffe auf KI-Systeme |
| **ClawHub**          | OpenClaws Marktplatz für Skills                                  |
| **Gateway**          | OpenClaws Ebene für Nachrichten-Routing und Authentifizierung    |
| **MCP**              | Model Context Protocol – Schnittstelle für Tool-Provider         |
| **Prompt-Injection** | Angriff, bei dem bösartige Anweisungen in Eingaben eingebettet werden |
| **Skill**            | Herunterladbare Erweiterung für OpenClaw-Agenten                  |
| **SSRF**             | Server-Side Request Forgery                                      |

---

_Dieses Bedrohungsmodell ist ein fortlaufend aktualisiertes Dokument. Melden Sie Sicherheitsprobleme an `security@openclaw.ai` oder lesen Sie die [Vertrauensseite](https://trust.openclaw.ai)._

## Verwandte Themen

- [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
- [Reaktion auf Sicherheitsvorfälle](/de/security/incident-response)
- [Netzwerk-Proxy](/de/security/network-proxy)
- [Formale Verifizierung](/de/security/formal-verification)
