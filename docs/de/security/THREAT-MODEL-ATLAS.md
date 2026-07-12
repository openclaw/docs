---
read_when:
    - Überprüfung der Sicherheitslage oder von Bedrohungsszenarien
    - Arbeiten an Sicherheitsfunktionen oder Audit-Antworten
summary: OpenClaw-Bedrohungsmodell, abgebildet auf das MITRE-ATLAS-Framework
title: Bedrohungsmodell (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T15:53:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Version:** 1.0-draft | **Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Bedrohungslandschaft für gegnerische Angriffe auf KI-Systeme) + Datenflussdiagramme

Dieses Bedrohungsmodell dokumentiert gegnerische Bedrohungen für die KI-Agentenplattform OpenClaw und den Skills-Marktplatz ClawHub. Es ist ein fortlaufend aktualisiertes Dokument, das von der OpenClaw-Community gepflegt wird. Unter [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL) erfahren Sie, wie Sie neue Bedrohungen melden, Angriffsketten vorschlagen oder Gegenmaßnahmen empfehlen können.

**Wichtige ATLAS-Ressourcen:** [Techniken](https://atlas.mitre.org/techniques/) | [Taktiken](https://atlas.mitre.org/tactics/) | [Fallstudien](https://atlas.mitre.org/studies/) | [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data) | [Zu ATLAS beitragen](https://atlas.mitre.org/resources/contribute)

---

## 1. Geltungsbereich

| Komponente                | Enthalten | Hinweise                                             |
| ------------------------- | --------- | ---------------------------------------------------- |
| OpenClaw-Agentenlaufzeit  | Ja        | Zentrale Agentenausführung, Tool-Aufrufe, Sitzungen  |
| Gateway                   | Ja        | Authentifizierung, Routing, Kanalintegration         |
| Kanalintegrationen        | Ja        | WhatsApp, Telegram, Discord, Signal, Slack usw.      |
| ClawHub-Marktplatz        | Ja        | Veröffentlichung, Moderation und Verteilung von Skills |
| MCP-Server                | Ja        | Externe Tool-Provider                                |
| Benutzergeräte            | Teilweise | Mobile Apps, Desktop-Clients                         |

Nicht abgedeckte Meldungen und typische Fehlalarme (öffentliche Erreichbarkeit über das Internet, reine Prompt-Injection-Ketten ohne Umgehung einer Sicherheitsgrenze, gegenseitig nicht vertrauenswürdige Betreiber auf demselben Gateway-Host und weitere) sind in [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) aufgeführt. Diese Datei ist die derzeit maßgebliche Quelle für den Geltungsbereich von Schwachstellenmeldungen, nicht diese Seite.

## 2. Systemarchitektur

### 2.1 Vertrauensgrenzen

```text
┌─────────────────────────────────────────────────────────────────┐
│                    NICHT VERTRAUENSWÜRDIGE ZONE                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 1: Kanalzugriff                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Gerätekopplung (1 Std. TTL für DM-/5 Min. für Node-Kopplung)│
│  │  • AllowFrom-/Zulassungslistenvalidierung                 │   │
│  │  • Token-/Passwort-/Tailscale-Authentifizierung           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 2: Sitzungsisolation            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENTENSITZUNGEN                        │   │
│  │  • Sitzungsschlüssel = agent:channel:peer                 │   │
│  │  • Tool-Richtlinien pro Agent                             │   │
│  │  • Protokollierung von Transkripten                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 3: Tool-Ausführung              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  AUSFÜHRUNGS-SANDBOX                      │   │
│  │  • Docker-Sandbox (Standard) oder Host (Ausführungsfreigaben)│
│  │  • Node-Remote-Ausführung                                 │   │
│  │  • SSRF-Schutz (DNS-Pinning + IP-Blockierung)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 4: Externe Inhalte              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ABGERUFENE URLs/E-MAILS/WEBHOOKS             │   │
│  │  • Kapselung externer Inhalte (XML-Tags mit zufälliger Grenze)│
│  │  • Einfügen von Sicherheitshinweisen                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTRAUENSGRENZE 5: Lieferkette                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Veröffentlichung von Skills (semver, SKILL.md erforderlich)│
│  │  • Moderationsprüfung statischer Muster und AST-naher Strukturen│
│  │  • LLM-basierte agentische Risikoprüfung + VirusTotal-Scan│
│  │  • Überprüfung des GitHub-Kontoalters (14 Tage)           │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Datenflüsse

| Fluss | Quelle  | Ziel     | Daten                | Schutz                  |
| ----- | ------- | -------- | -------------------- | ----------------------- |
| F1    | Kanal   | Gateway  | Benutzernachrichten  | TLS, AllowFrom          |
| F2    | Gateway | Agent    | Weitergeleitete Nachrichten | Sitzungsisolation |
| F3    | Agent   | Tools    | Tool-Aufrufe         | Richtliniendurchsetzung |
| F4    | Agent   | Extern   | `web_fetch`-Anfragen | SSRF-Blockierung        |
| F5    | ClawHub | Agent    | Skill-Code           | Moderation, Scans       |
| F6    | Agent   | Kanal    | Antworten            | Ausgabefilterung        |

---

## 3. Bedrohungsanalyse nach ATLAS-Taktik

### 3.1 Aufklärung (AML.TA0002)

#### T-RECON-001: Ermittlung von Agentenendpunkten

| Attribut                | Wert                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Aktives Scannen                                            |
| **Beschreibung**        | Der Angreifer sucht nach offengelegten OpenClaw-Gateway-Endpunkten     |
| **Angriffsvektor**      | Netzwerkscans, Shodan-Abfragen, DNS-Enumeration                        |
| **Betroffene Komponenten** | Gateway, offengelegte API-Endpunkte                                 |
| **Aktuelle Gegenmaßnahmen** | Optionale Tailscale-Authentifizierung, standardmäßige Bindung an Loopback |
| **Restrisiko**          | Mittel – öffentliche Gateways sind auffindbar                          |
| **Empfehlungen**        | Sichere Bereitstellung dokumentieren, Ratenbegrenzung für Ermittlungsendpunkte hinzufügen |

#### T-RECON-002: Sondierung von Kanalintegrationen

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Aktives Scannen                                          |
| **Beschreibung**        | Der Angreifer sondiert Nachrichtenkanäle, um KI-verwaltete Konten zu identifizieren |
| **Angriffsvektor**      | Senden von Testnachrichten, Beobachten von Antwortmustern             |
| **Betroffene Komponenten** | Alle Kanalintegrationen                                            |
| **Aktuelle Gegenmaßnahmen** | Keine spezifischen                                                |
| **Restrisiko**          | Niedrig – alleinige Ermittlung hat nur begrenzten Nutzen              |
| **Empfehlungen**        | Zufällige Variation der Antwortzeiten erwägen                         |

---

### 3.2 Erstzugriff (AML.TA0004)

#### T-ACCESS-001: Abfangen des Kopplungscodes

| Attribut                | Wert                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                                                                   |
| **Beschreibung**        | Ein Angreifer fängt während des Kopplungszeitfensters einen Kopplungscode ab (1h für DM/allgemeine Kopplung, 5m für Node-Kopplung) |
| **Angriffsvektor**      | Ausspähen durch Beobachten, Netzwerk-Sniffing, Social Engineering                                                           |
| **Betroffene Komponenten** | Gerätekopplungssystem                                                                                                    |
| **Aktuelle Schutzmaßnahmen** | 1h TTL (DM/allgemeine Kopplung), 5m TTL (Node-Kopplung); Codes werden über den bestehenden Kanal gesendet              |
| **Restrisiko**          | Mittel – Kopplungszeitfenster kann ausgenutzt werden                                                                        |
| **Empfehlungen**        | Kopplungszeitfenster verkürzen, einen Bestätigungsschritt hinzufügen                                                        |

#### T-ACCESS-002: AllowFrom-Spoofing

| Attribut                | Wert                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                                  |
| **Beschreibung**        | Ein Angreifer fälscht die Identität eines zulässigen Absenders in einem Kanal              |
| **Angriffsvektor**      | Kanalabhängig – Fälschung von Telefonnummern, Nachahmung von Benutzernamen                  |
| **Betroffene Komponenten** | Kanalbezogene AllowFrom-Validierung                                                      |
| **Aktuelle Schutzmaßnahmen** | Kanalspezifische Identitätsprüfung                                                     |
| **Restrisiko**          | Mittel – einige Kanäle bleiben für Spoofing anfällig                                       |
| **Empfehlungen**        | Kanalspezifische Risiken dokumentieren, nach Möglichkeit kryptografische Verifizierung hinzufügen |

#### T-ACCESS-003: Token-Diebstahl

| Attribut                | Wert                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells                         |
| **Beschreibung**        | Ein Angreifer stiehlt Authentifizierungs-Token aus Konfigurations-/Anmeldedatendateien |
| **Angriffsvektor**      | Schadsoftware, unbefugter Gerätezugriff, Offenlegung von Konfigurationssicherungen |
| **Betroffene Komponenten** | Speicherung von Kanal-/Provider-Anmeldedaten, Konfigurationsspeicher           |
| **Aktuelle Schutzmaßnahmen** | Dateiberechtigungen                                                           |
| **Restrisiko**          | Hoch – Token werden im Klartext auf dem Datenträger gespeichert                   |
| **Empfehlungen**        | Verschlüsselung ruhender Token implementieren, Token-Rotation hinzufügen          |

---

### 3.3 Ausführung (AML.TA0005)

#### T-EXEC-001: Direkte Prompt-Injection

| Attribut                | Wert                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                                                                                                               |
| **Beschreibung**        | Ein Angreifer sendet speziell präparierte Prompts, um das Verhalten des Agenten zu manipulieren                                                             |
| **Angriffsvektor**      | Kanalnachrichten mit schädlichen Anweisungen                                                                                                               |
| **Betroffene Komponenten** | Agenten-LLM, alle Eingabeschnittstellen                                                                                                                  |
| **Aktuelle Schutzmaßnahmen** | Mustererkennung, Einbettung externer Inhalte; gilt ohne Umgehung einer Sicherheitsgrenze als außerhalb des Umfangs von Schwachstellenmeldungen (siehe `SECURITY.md`) |
| **Restrisiko**          | Kritisch – nur Erkennung, keine Blockierung; ausgefeilte Angriffe umgehen sie                                                                               |
| **Empfehlungen**        | Ausgabevalidierung und Benutzerbestätigung für sensible Aktionen zusätzlich zur bestehenden Erkennung                                                      |

#### T-EXEC-002: Indirekte Prompt-Injection

| Attribut                | Wert                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.001 - LLM-Prompt-Injection: Indirekt                                                                                     |
| **Beschreibung**        | Ein Angreifer bettet schädliche Anweisungen in abgerufene Inhalte ein                                                              |
| **Angriffsvektor**      | Schädliche URLs, manipulierte E-Mails, kompromittierte Webhooks                                                                    |
| **Betroffene Komponenten** | `web_fetch`, E-Mail-Erfassung, externe Datenquellen                                                                              |
| **Aktuelle Schutzmaßnahmen** | Einbettung von Inhalten mit zufälligen XML-artigen Begrenzungsmarkierungen, Normalisierung von Homoglyphen/Spezial-Token und einem Sicherheitshinweis |
| **Restrisiko**          | Hoch – das LLM kann die Wrapper-Anweisungen weiterhin ignorieren                                                                   |
| **Empfehlungen**        | Separate Ausführungskontexte für eingebettete Inhalte                                                                              |

#### T-EXEC-003: Einschleusung von Tool-Argumenten

| Attribut                | Wert                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-Prompt-Injection: Direkt                            |
| **Beschreibung**        | Ein Angreifer manipuliert Tool-Argumente durch Prompt-Injection          |
| **Angriffsvektor**      | Speziell präparierte Prompts, die Parameterwerte von Tools beeinflussen  |
| **Betroffene Komponenten** | Alle Tool-Aufrufe                                                     |
| **Aktuelle Schutzmaßnahmen** | Ausführungsgenehmigungen für gefährliche Befehle                     |
| **Restrisiko**          | Hoch – beruht auf dem Urteilsvermögen des Benutzers                      |
| **Empfehlungen**        | Argumentvalidierung, parametrisierte Tool-Aufrufe                         |

#### T-EXEC-004: Umgehung der Ausführungsgenehmigung

| Attribut                | Wert                                                                                                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Erstellen schädlicher Daten                                                                                                                                                                |
| **Beschreibung**        | Ein Angreifer erstellt Befehle, welche die Genehmigungs-Positivliste umgehen                                                                                                                           |
| **Angriffsvektor**      | Befehlsverschleierung, Ausnutzung von Aliasen, Pfadmanipulation                                                                                                                                        |
| **Betroffene Komponenten** | `src/infra/exec-approvals*.ts`, Befehls-Positivliste                                                                                                                                                 |
| **Aktuelle Schutzmaßnahmen** | Positivliste + Nachfragemodus sowie Befehlsnormalisierung (Entfernung von Dispatch-Wrappern, Erkennung von Inline-Auswertung, Analyse von Shell-Befehlsketten)                                      |
| **Restrisiko**          | Hoch – die Normalisierung schränkt Umgehungen durch Verschleierung ein, beseitigt sie jedoch nicht; reine Paritätsbefunde zwischen Ausführungspfaden gelten als Härtung, nicht als Schwachstellen (siehe `SECURITY.md`) |
| **Empfehlungen**        | Abdeckung der Befehlsnormalisierung gegen neue Verschleierungstechniken kontinuierlich erweitern                                                                                                       |

---

### 3.4 Persistenz (AML.TA0006)

#### T-PERSIST-001: Installation eines schädlichen Skills

| Attribut                | Wert                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Kompromittierung der Lieferkette: KI-Software                                                                    |
| **Beschreibung**        | Ein Angreifer veröffentlicht einen schädlichen Skill auf ClawHub                                                                 |
| **Angriffsvektor**      | Konto erstellen, Skill mit verstecktem schädlichem Code veröffentlichen                                                          |
| **Betroffene Komponenten** | ClawHub, Laden von Skills, Agentenausführung                                                                                   |
| **Aktuelle Schutzmaßnahmen** | Prüfung des GitHub-Kontoalters, statische musterbasierte/AST-nahe Scans, LLM-basierte agentische Risikoprüfung, VirusTotal-Scans |
| **Restrisiko**          | Hoch – Erkennungsebenen sind vorhanden, Skills werden jedoch weiterhin mit Agentenberechtigungen und ohne Ausführungs-Sandbox ausgeführt |
| **Empfehlungen**        | Sandbox für die Ausführung von Skills, erweiterte Community-Prüfung                                                               |

#### T-PERSIST-002: Manipulation einer Skill-Aktualisierung

| Attribut                | Wert                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0010.001 - Kompromittierung der Lieferkette: KI-Software                         |
| **Beschreibung**        | Ein Angreifer kompromittiert einen beliebten Skill und stellt eine schädliche Aktualisierung bereit |
| **Angriffsvektor**      | Kontokompromittierung, Social Engineering des Skill-Eigentümers                       |
| **Betroffene Komponenten** | ClawHub-Versionierung, automatische Aktualisierungsabläufe                          |
| **Aktuelle Schutzmaßnahmen** | Versions-Fingerprinting, erneute Moderation/Prüfung neuer Versionen                |
| **Restrisiko**          | Hoch – automatische Aktualisierungen können schädliche Versionen abrufen, bevor die Prüfung abgeschlossen ist |
| **Empfehlungen**        | Signierung von Aktualisierungen, Rollback-Funktion, Versionsfixierung                 |

#### T-PERSIST-003: Manipulation der Agentenkonfiguration

| Attribut                | Wert                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.002 - Kompromittierung der Lieferkette: Daten              |
| **Beschreibung**        | Angreifer verändert die Agent-Konfiguration, um den Zugriff dauerhaft aufrechtzuerhalten |
| **Angriffsvektor**      | Änderung der Konfigurationsdatei, Einschleusen von Einstellungen     |
| **Betroffene Komponenten** | Agent-Konfiguration, Tool-Richtlinien                             |
| **Aktuelle Schutzmaßnahmen** | Dateiberechtigungen                                              |
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
| **Aktuelle Schutzmaßnahmen** | Statische Musterregeln, AST-nahe Codeanalyse, LLM-Prüfung agentischer Risiken, VirusTotal |
| **Restrisiko**          | Mittel – neuartige Verschleierung kann mehrschichtige Heuristiken weiterhin umgehen |
| **Empfehlungen**        | Den Muster- und Verhaltenskorpus weiter ausbauen, sobald neue Umgehungsmethoden entdeckt werden |

#### T-EVADE-002: Ausbruch aus der Inhaltsumhüllung

| Attribut                | Wert                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Erstellen adversarieller Daten                                                                   |
| **Beschreibung**        | Angreifer erstellt Inhalte, die aus dem Kontext der Umhüllung externer Inhalte ausbrechen                    |
| **Angriffsvektor**      | Tag-Manipulation, Kontextverwirrung, Überschreiben von Anweisungen                                           |
| **Betroffene Komponenten** | Umhüllung externer Inhalte                                                                                |
| **Aktuelle Schutzmaßnahmen** | XML-artige Markierungen mit zufälligen Begrenzungen und Sicherheitshinweis sowie Erkennung gefälschter Markierungen durch Homoglyphen und Leerraumvarianten |
| **Restrisiko**          | Mittel – neuartige Ausbruchsmöglichkeiten werden regelmäßig entdeckt                                       |
| **Empfehlungen**        | Ausgabeseitige Validierung zusätzlich zur eingabeseitigen Umhüllung                                         |

---

### 3.6 Erkundung (AML.TA0008)

#### T-DISC-001: Aufzählung von Tools

| Attribut                | Wert                                                 |
| ----------------------- | ---------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells |
| **Beschreibung**        | Angreifer ermittelt durch Prompts die verfügbaren Tools |
| **Angriffsvektor**      | Anfragen nach dem Muster „Welche Tools haben Sie?“   |
| **Betroffene Komponenten** | Tool-Registry des Agenten                          |
| **Aktuelle Schutzmaßnahmen** | Keine spezifischen Maßnahmen                     |
| **Restrisiko**          | Niedrig – Tools sind im Allgemeinen dokumentiert     |
| **Empfehlungen**        | Kontrollen für die Sichtbarkeit von Tools erwägen    |

#### T-DISC-002: Extraktion von Sitzungsdaten

| Attribut                | Wert                                                   |
| ----------------------- | ------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0040 - Zugriff auf die Inferenz-API eines KI-Modells |
| **Beschreibung**        | Angreifer extrahiert sensible Daten aus dem Sitzungskontext |
| **Angriffsvektor**      | Anfragen wie „Was haben wir besprochen?“, Untersuchung des Kontexts |
| **Betroffene Komponenten** | Sitzungstranskripte, Kontextfenster                  |
| **Aktuelle Schutzmaßnahmen** | Sitzungsisolierung pro Absender (Schlüssel `agent:channel:peer`) |
| **Restrisiko**          | Mittel – Daten innerhalb der Sitzung sind konstruktionsbedingt zugänglich |
| **Empfehlungen**        | Schwärzung sensibler Daten im Kontext                   |

---

### 3.7 Sammlung und Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Datendiebstahl über web_fetch

| Attribut                | Wert                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                            |
| **Beschreibung**        | Angreifer exfiltriert Daten, indem er den Agenten anweist, sie an eine externe URL zu senden |
| **Angriffsvektor**      | Prompt-Injection, durch die der Agent Daten per POST an einen Server des Angreifers sendet |
| **Betroffene Komponenten** | Tool `web_fetch`                                                             |
| **Aktuelle Schutzmaßnahmen** | SSRF-Blockierung für interne/private Netzwerke (DNS-Pinning und IP-Blockierung) |
| **Restrisiko**          | Hoch – beliebige externe URLs bleiben zulässig                                  |
| **Empfehlungen**        | URL-Zulassungsliste, Berücksichtigung der Datenklassifizierung                  |

#### T-EXFIL-002: Unbefugtes Senden von Nachrichten

| Attribut                | Wert                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                               |
| **Beschreibung**        | Angreifer veranlasst den Agenten, Nachrichten mit sensiblen Daten zu senden |
| **Angriffsvektor**      | Prompt-Injection, durch die der Agent dem Angreifer eine Nachricht sendet |
| **Betroffene Komponenten** | Nachrichten-Tool, Kanalintegrationen                            |
| **Aktuelle Schutzmaßnahmen** | Freigabekontrolle für ausgehende Nachrichten                  |
| **Restrisiko**          | Mittel – die Freigabekontrolle kann möglicherweise umgangen werden |
| **Empfehlungen**        | Explizite Bestätigung für neue Empfänger                            |

#### T-EXFIL-003: Abgreifen von Zugangsdaten

| Attribut                | Wert                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0009 - Sammlung                                                                                                                                   |
| **Beschreibung**        | Ein bösartiger Skill greift Zugangsdaten aus dem Agent-Kontext ab                                                                                      |
| **Angriffsvektor**      | Skill-Code liest Umgebungsvariablen und Konfigurationsdateien                                                                                          |
| **Betroffene Komponenten** | Skill-Ausführungsumgebung                                                                                                                           |
| **Aktuelle Schutzmaßnahmen** | ClawHub-Scan nach Zugangsdatenmustern (hartcodierte Geheimnisse, Zugriff auf Zugangsdaten-Umgebungsvariablen in Verbindung mit Netzwerkübertragungen); keine Sandbox-Ausführung für Skills zur Laufzeit |
| **Restrisiko**          | Kritisch – Skills werden mit den Berechtigungen des Agenten ausgeführt                                                                                 |
| **Empfehlungen**        | Sandbox-Ausführung für Skills, Isolierung von Zugangsdaten                                                                                             |

---

### 3.8 Auswirkungen (AML.TA0011)

#### T-IMPACT-001: Unbefugte Befehlsausführung

| Attribut                | Wert                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Beeinträchtigung der Integrität von KI-Modellen                                         |
| **Beschreibung**        | Angreifer führt beliebige Befehle auf dem System des Benutzers aus                                  |
| **Angriffsvektor**      | Prompt-Injection in Kombination mit der Umgehung der Ausführungsfreigabe                             |
| **Betroffene Komponenten** | Bash-Tool, Befehlsausführung                                                                     |
| **Aktuelle Schutzmaßnahmen** | Ausführungsfreigaben, Docker-Sandbox-Option (standardmäßiges Laufzeit-Backend)                    |
| **Restrisiko**          | Kritisch – Ausführung auf dem Host ist möglich, wenn die Sandbox deaktiviert ist                     |
| **Empfehlungen**        | Benutzerführung für Freigaben verbessern; Bereitstellungen ohne Sandbox bleiben eine bewusste Entscheidung des Betreibers und werden als solche dokumentiert |

#### T-IMPACT-002: Ressourcenerschöpfung (DoS)

| Attribut                | Wert                                              |
| ----------------------- | ------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Beeinträchtigung der Integrität von KI-Modellen |
| **Beschreibung**        | Angreifer erschöpft API-Guthaben oder Rechenressourcen |
| **Angriffsvektor**      | Automatisierte Nachrichtenflut, kostspielige Tool-Aufrufe |
| **Betroffene Komponenten** | Gateway, Agent-Sitzungen, API-Provider          |
| **Aktuelle Schutzmaßnahmen** | Keine                                         |
| **Restrisiko**          | Hoch – keine Ratenbegrenzung pro Absender          |
| **Empfehlungen**        | Ratenbegrenzungen pro Absender, Kostenbudgets      |

#### T-IMPACT-003: Rufschädigung

| Attribut                | Wert                                                       |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Beeinträchtigung der Integrität von KI-Modellen |
| **Beschreibung**        | Angreifer veranlasst den Agenten, schädliche oder anstößige Inhalte zu senden |
| **Angriffsvektor**      | Prompt-Injection, die unangemessene Antworten verursacht   |
| **Betroffene Komponenten** | Ausgabeerzeugung, Kanalnachrichten                       |
| **Aktuelle Schutzmaßnahmen** | Inhaltsrichtlinien des LLM-Providers                    |
| **Restrisiko**          | Mittel – Provider-Filter sind unvollkommen                  |
| **Empfehlungen**        | Ausgabefilterschicht, Benutzerkontrollen                    |

---

## 4. ClawHub-Lieferkettenanalyse

### 4.1 Aktuelle Sicherheitskontrollen

| Kontrollmaßnahme                 | Implementierung                                                                              | Wirksamkeit                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Alter des GitHub-Kontos          | `requireGitHubAccountAge()` (mindestens 14 Tage)                                              | Mittel – erhöht die Hürde für neue Angreifer                            |
| Pfadbereinigung                  | `sanitizePath()`                                                                              | Hoch – verhindert Pfadmanipulation                                      |
| Dateitypvalidierung              | `isTextFile()`                                                                                | Mittel – nur Textdateien werden gescannt, aber weiterhin ausnutzbar     |
| Größenbeschränkungen             | insgesamt 50 MB pro Paket (`MAX_PUBLISH_TOTAL_BYTES`)                                         | Hoch – verhindert Ressourcenerschöpfung                                 |
| Erforderliche SKILL.md           | Verpflichtende Readme-Datei bei der Veröffentlichung                                          | Geringer Sicherheitswert – nur informativ                               |
| Statisches + AST-nahes Scannen   | Muster-Engine für Ausführung, Exfiltration, Zugangsdatenabgriff, Verschleierung und mehr       | Mittel bis hoch – deckt viele bekannte Missbrauchsmuster ab, bleibt aber musterbasiert |
| LLM-basierte agentische Risikoprüfung | Durch Sicherheits-Prompt gesteuertes Urteil bei der Veröffentlichung                     | Mittel bis hoch – erkennt Verhaltensweisen, die statische Muster übersehen |
| VirusTotal-Scanning              | In Veröffentlichungs- und erneute Scanabläufe für Skills und Pakete integriert; durch API-Schlüssel des Betreibers gesteuert | Hoch, wenn aktiviert – Erkennung durch statische Engines                 |
| Moderationsstatus                | Feld `moderationStatus`                                                                       | Mittel – manuelle Prüfung möglich                                       |

### 4.2 Einschränkungen der Moderation

Das statische Scanning von ClawHub untersucht den Codeinhalt von Skills direkt (nicht nur Slug, Metadaten oder Frontmatter) und deckt gefährliche Ausführungsaufrufe, dynamische Codeausführung, den Abgriff von Zugangsdaten, Exfiltrationsmuster, verschleierte Payloads und mehr ab. Bekannte Lücken:

- Die musterbasierte Erkennung kann weiterhin durch hinreichend neuartige Verschleierung umgangen werden.
- LLM-basierte Prüfungen und VirusTotal-Scanning setzen voraus, dass betreiberseitige API-Schlüssel bzw. die entsprechende Konfiguration aktiviert sind.
- Nach der Installation isoliert keine Laufzeit-Sandbox einen Skill von den eigenen Berechtigungen des Agenten.

### 4.3 Abzeichen

Skills und Pakete tragen von Moderatoren zugewiesene Abzeichen: `highlighted`, `official`, `deprecated`, `redactionApproved` (nur Skills). Meldungen aus der Community (`skillReports`) und Audit-Protokollierung (`auditLogs`) unterstützen die Moderationsabläufe.

---

## 5. Risikomatrix

### 5.1 Wahrscheinlichkeit im Verhältnis zur Auswirkung

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

**Kette 2: Prompt-Injection bis zur Remotecodeausführung**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Prompt einschleusen) → (Ausführungsgenehmigung umgehen) → (Befehle ausführen)
```

**Kette 3: Indirekte Injection über abgerufene Inhalte**

```text
T-EXEC-002 → T-EXFIL-001 → Externe Exfiltration
(URL-Inhalt manipulieren) → (Agent ruft Inhalte ab und folgt den Anweisungen) → (Daten werden an den Angreifer gesendet)
```

---

## 6. Zusammenfassung der Empfehlungen

### 6.1 Sofort (P0)

| ID    | Empfehlung                                             | Behandelt                  |
| ----- | ------------------------------------------------------ | -------------------------- |
| R-002 | Sandbox für die Ausführung von Skills implementieren   | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Ausgabevalidierung für sensible Aktionen hinzufügen    | T-EXEC-001, T-EXEC-002     |

### 6.2 Kurzfristig (P1)

| ID    | Empfehlung                                                                       | Behandelt    |
| ----- | -------------------------------------------------------------------------------- | ------------ |
| R-004 | Ratenbegrenzung pro Absender implementieren                                       | T-IMPACT-002 |
| R-005 | Verschlüsselung ruhender Tokens hinzufügen                                        | T-ACCESS-003 |
| R-006 | Benutzeroberfläche für Ausführungsgenehmigungen verbessern und Befehlsnormalisierung weiter ausbauen | T-EXEC-004   |
| R-007 | URL-Positivliste für `web_fetch` implementieren                                   | T-EXFIL-001  |

### 6.3 Mittelfristig (P2)

| ID    | Empfehlung                                                          | Behandelt     |
| ----- | ------------------------------------------------------------------- | ------------- |
| R-008 | Wo möglich kryptografische Kanalverifizierung hinzufügen            | T-ACCESS-002  |
| R-009 | Integritätsprüfung der Konfiguration implementieren                  | T-PERSIST-003 |
| R-010 | Signierung von Aktualisierungen und Versionsfixierung hinzufügen     | T-PERSIST-002 |

---

## 7. Anhänge

### 7.1 Zuordnung zu ATLAS-Techniken

| ATLAS-ID      | Name der Technik                         | OpenClaw-Bedrohungen                                             |
| ------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| AML.T0006     | Aktives Scannen                          | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Sammlung                                 | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Lieferkette: KI-Software                 | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Lieferkette: Daten                       | T-PERSIST-003                                                    |
| AML.T0031     | Integrität von KI-Modellen beeinträchtigen | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                       |
| AML.T0040     | Zugriff auf die Inferenz-API von KI-Modellen | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Adversariale Daten erstellen             | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM-Prompt-Injection: direkt             | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM-Prompt-Injection: indirekt           | T-EXEC-002                                                       |

### 7.2 Wichtige Sicherheitsdateien

| Pfad                                | Zweck                                      | Risikostufe  |
| ----------------------------------- | ------------------------------------------ | ------------ |
| `src/infra/exec-approvals.ts`       | Logik für Befehlsfreigaben                  | **Kritisch** |
| `src/gateway/auth.ts`               | Gateway-Authentifizierung                   | **Kritisch** |
| `src/infra/net/ssrf.ts`             | SSRF-Schutz                                 | **Kritisch** |
| `src/security/external-content.ts`  | Abwehr von Prompt-Injection                 | **Kritisch** |
| `src/agents/sandbox/tool-policy.ts` | Zulassungs-/Sperrrichtlinie für Sandbox-Tools | **Kritisch** |
| `src/routing/resolve-route.ts`      | Sitzungsisolierung/Routing                  | **Mittel**   |

### 7.3 Glossar

| Begriff              | Definition                                                      |
| -------------------- | --------------------------------------------------------------- |
| **ATLAS**            | MITREs Landschaft adversarialer Bedrohungen für KI-Systeme      |
| **ClawHub**          | Marktplatz für OpenClaw-Skills                                  |
| **Gateway**          | Schicht für Nachrichten-Routing und Authentifizierung in OpenClaw |
| **MCP**              | Model Context Protocol – Schnittstelle für Tool-Provider         |
| **Prompt-Injection** | Angriff, bei dem bösartige Anweisungen in Eingaben eingebettet werden |
| **Skill**            | Herunterladbare Erweiterung für OpenClaw-Agenten                 |
| **SSRF**             | Serverseitige Anfragefälschung                                   |

---

_Dieses Bedrohungsmodell ist ein fortlaufend aktualisiertes Dokument. Melden Sie Sicherheitsprobleme an `security@openclaw.ai` oder lesen Sie die [Vertrauensseite](https://trust.openclaw.ai)._

## Verwandte Themen

- [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
- [Reaktion auf Sicherheitsvorfälle](/de/security/incident-response)
- [Netzwerk-Proxy](/de/security/network-proxy)
- [Formale Verifizierung](/de/security/formal-verification)
