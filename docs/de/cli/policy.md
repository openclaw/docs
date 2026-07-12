---
read_when:
    - Sie möchten die OpenClaw-Einstellungen anhand einer erstellten policy.jsonc überprüfen
    - Sie möchten Richtlinienbefunde in der Doctor-Prüfung sehen
    - Sie benötigen einen Hash der Richtlinienbestätigung als Auditnachweis
summary: CLI-Referenz für `openclaw policy`-Konformitätsprüfungen
title: Richtlinie
x-i18n:
    generated_at: "2026-07-12T15:08:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` wird vom gebündelten Policy-Plugin bereitgestellt. Es handelt sich um eine unternehmensweite
Konformitätsschicht über den vorhandenen OpenClaw-Einstellungen, nicht um ein zweites
Konfigurationssystem. Sie definieren Anforderungen in `policy.jsonc`; OpenClaw erfasst den aktiven
Workspace als Nachweis; Policy meldet Abweichungen über `doctor --lint`. Policy
erzwingt keine Tool-Aufrufe und schreibt das Laufzeitverhalten nicht zum Anfragezeitpunkt um.
Außerdem attestiert es keine agentspezifischen Anmeldedatenspeicher wie `auth-profiles.json`.

Policy prüft konfigurierte Kanäle, MCP-Server, Modell-Provider, die SSRF-
Absicherung des Netzwerks, Ingress-/Kanalzugriff, Gateway-Exposition und die Befehlsabsicherung von Nodes,
den Workspace-Zugriff von Agents, die Sandbox-Absicherung, die Datenverarbeitungsabsicherung, die Absicherung von Secret-
Providern und Authentifizierungsprofilen sowie Metadaten verwalteter Tools (`TOOLS.md`). Verwenden Sie es,
wenn ein Workspace eine dauerhafte, überprüfbare Vorgabe benötigt, beispielsweise „Telegram darf
nicht aktiviert sein“ oder „verwaltete Tools müssen Risiko- und Eigentümermetadaten deklarieren“. Wenn
Sie lediglich lokales Verhalten ohne Attestierung oder Abweichungserkennung benötigen, reicht die normale
Konfiguration aus.

## Schnellstart

```bash
openclaw plugins enable policy
```

Das Plugin bleibt auch dann aktiviert, wenn `policy.jsonc` fehlt, damit Doctor
das fehlende Artefakt melden kann, statt Prüfungen stillschweigend zu überspringen.

Erstellen Sie `policy.jsonc` manuell; die Datei wird nicht aus den aktuellen Einstellungen generiert. Jeder
Abschnitt auf oberster Ebene ist ein Regel-Namespace: Eine Prüfung wird nur ausgeführt, wenn darunter eine konkrete Regel
vorhanden ist (nicht unterstützte Abschnitte oder Schlüssel führen zu
`policy/policy-jsonc-invalid`, statt stillschweigend ignoriert zu werden). Minimales
Beispiel, das alle unterstützten Abschnitte abdeckt:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram ist für diesen Workspace nicht genehmigt.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Abschnittsübergreifende Hinweise, die aus den folgenden Regeltabellen nicht unmittelbar hervorgehen:

- Wenn Sie `gateway.bind` weglassen und gleichzeitig Nicht-Loopback-Bindungen verweigern, akzeptieren Sie
  den Laufzeitstandard; legen Sie für strikte Konformität `gateway.bind: "loopback"` fest.
- Legen Sie für einen schreibgeschützten Agent den Sandbox-`mode` in den
  zutreffenden Standardwerten bzw. beim Agent auf `all` oder `non-main` und `workspaceAccess` auf `none` oder `ro` fest. Ein fehlender oder
  auf `off` gesetzter Sandbox-Modus erfüllt keine schreibgeschützte Policy.
- `agents.workspace.denyTools` akzeptiert `exec`, `process`, `write`, `edit`,
  `apply_patch`. Die Tool-Verweigerungsgruppen der Konfiguration `group:fs` (Dateiänderung) und
  `group:runtime` (Shell/Prozess) erfüllen die entsprechende Absicherung.
- Prüfungen der Ausführungsgenehmigungen lesen das aktuelle Artefakt `exec-approvals.json` nur, wenn
  eine `execApprovals`-Regel vorhanden ist; ein fehlendes oder ungültiges Artefakt ist
  nicht beobachtbarer Nachweis und kein künstlich erzeugter erfolgreicher Prüfstatus.
- Nachweise zu Secrets und Authentifizierungsprofilen erfassen nur die Absicherung von Provider/Quelle und
  SecretRef-Metadaten, niemals Rohwerte. Policy liest oder attestiert keine
  agentspezifischen Anmeldedatenspeicher wie `auth-profiles.json`.
- Nachweise zur Datenverarbeitung bilden nur die Absicherung auf Konfigurationsebene ab (Schwärzungsmodus,
  Umschalter für Telemetrieerfassung, Sitzungswartungsmodus, Einstellung zur Transkriptindizierung).
  Sie untersuchen weder Protokolle, Telemetrieexporte, Transkripte noch
  Memory-Dateien, und ein einwandfreies Ergebnis beweist nicht, dass darin keine personenbezogenen Daten oder
  Secrets enthalten sind.

### Referenz der Policy-Regeln

Jede nachstehende Regel ist optional; eine Prüfung wird nur ausgeführt, wenn die Regel vorhanden ist. Der
beobachtete Zustand besteht aus der vorhandenen OpenClaw-Konfiguration oder den Workspace-Metadaten.

#### Bereichsbezogene Overlays

Verwenden Sie `scopes.<scopeName>`, wenn bestimmte Agents oder Kanäle eine strengere Policy
als die globale Basislinie benötigen. Der Bereichsname ist lediglich eine Bezeichnung; der Abgleich erfolgt über den
Selektor innerhalb des Bereichs. Overlays sind additiv: Die globale Regel wird weiterhin ausgeführt,
und die bereichsbezogene Regel kann für denselben Nachweis einen eigenen Befund hinzufügen.

| Selektor     | Unterstützte Abschnitte                                                         | Verwenden, wenn                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Ein oder mehrere Laufzeit-Agents strengere Regeln benötigen.   |
| `channelIds` | `ingress.channels`                                                             | Ein oder mehrere Kanäle strengere Ingress-Regeln benötigen. |

Wenn ein `agentIds`-Eintrag nicht in `agents.list[]` vorhanden ist, wertet OpenClaw
die bereichsbezogene Regel anhand der geerbten globalen/standardmäßigen Absicherung für diese Laufzeit-
Agent-ID aus, statt sie zu überspringen.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Derselbe Agent kann in mehreren Bereichen vorkommen, wenn jeder Bereich wie oben ein anderes
Feld verwaltet. Ein wiederholtes bereichsbezogenes Feld für denselben Agent muss gleich oder
restriktiver sein; eine schwächere doppelte Vorgabe wird abgelehnt (Positivlisten sind
Teilmengen, Sperrlisten sind Obermengen, erforderliche boolesche Werte sind festgelegt).

Regeln zur Container-Absicherung (`sandbox.containers.*`) werden nur anhand von
Nachweisen geprüft, die das Sandbox-Backend des zugeordneten Agent bereitstellen kann. Wenn ein Backend
eine dafür aktivierte Regel nicht beobachten kann, meldet Policy
`policy/sandbox-container-posture-unobservable`, statt die Prüfung als erfolgreich zu werten; beschränken Sie
Container-Regeln auf die Agent-Gruppen, die ein Backend verwenden, das sie bereitstellen kann.

`ingress.session.requireDmScope` auf oberster Ebene bleibt global; `session.dmScope` ist
kein einem Kanal zuordenbarer Nachweis und kann daher nicht über `channelIds` eingeschränkt werden.

Jeder in `policy.jsonc` vorhandene Bereich muss gültig und durchsetzbar sein.

#### Kanäle

| Policy-Feld                         | Beobachteter Zustand                          | Verwenden, wenn                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Provider und Aktivierungsstatus von `channels.*` | Konfigurierte Kanäle eines Providers wie `telegram` verweigert werden sollen. |
| `channels.denyRules[].reason`        | Kontext für Befundmeldung und Reparaturhinweis | Erläutert werden soll, warum der Provider verweigert wird.                          |

#### MCP-Server

| Policy-Feld        | Beobachteter Zustand      | Verwenden, wenn                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | IDs von `mcp.servers.*` | Jeder konfigurierte MCP-Server in einer Positivliste enthalten sein muss. |
| `mcp.servers.deny`  | IDs von `mcp.servers.*` | Bestimmte konfigurierte MCP-Server-IDs verweigert werden sollen.                   |

#### Modell-Provider

| Policy-Feld             | Beobachteter Zustand                                   | Verwenden, wenn                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | IDs von `models.providers.*` und ausgewählte Modellreferenzen | Konfigurierte Provider und ausgewählte Modellreferenzen genehmigte Provider verwenden müssen. |
| `models.providers.deny`  | IDs von `models.providers.*` und ausgewählte Modellreferenzen | Konfigurierte Provider und ausgewählte Modellreferenzen anhand der Provider-ID verweigert werden sollen.               |

#### Netzwerk

| Policy-Feld                   | Beobachteter Zustand                      | Verwenden, wenn                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | SSRF-Ausnahmen für private Netzwerke | Auf `false` setzen, um zu verlangen, dass der Zugriff auf private Netzwerke deaktiviert bleibt. |

#### Ingress und Kanalzugriff

| Richtlinienfeld                           | Beobachteter Zustand                                          | Verwenden, wenn                                                        |
| ----------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Ein geprüfter Isolationsbereich für Direktnachrichten erforderlich ist. |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` und ältere DM-Richtlinienfelder für Kanäle | Nur geprüfte Kanalrichtlinien für Direktnachrichten zulässig sein sollen. |
| `ingress.channels.denyOpenGroups`         | Eingangsrichtlinie für Kanal, Konto und Gruppe                 | Offener Gruppeneingang für konfigurierte Kanäle und Konten verweigert werden soll. |
| `ingress.channels.requireMentionInGroups` | Konfiguration der Erwähnungssperre für Kanal, Konto, Gruppe, Guild und verschachtelte Ebenen | Erwähnungssperren erforderlich sein sollen, wenn der Gruppeneingang offen oder erwähnungsbeschränkt ist. |

#### Gateway

| Richtlinienfeld                        | Beobachteter Zustand                            | Verwenden, wenn                                                                    |
| -------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Auf `false` setzen, um eine Gateway-Bindung an die Loopback-Schnittstelle zu verlangen. |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale-Serve-/Funnel-Gateway-Sicherheitsstatus | Auf `false` setzen, um eine Exposition über Tailscale Funnel zu verweigern.        |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Auf `true` setzen, um deaktivierte Gateway-Authentifizierung abzulehnen.           |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Auf `true` setzen, um eine explizite Konfiguration der Authentifizierungs-Ratenbegrenzung zu verlangen. |
| `gateway.controlUi.allowInsecure`       | Unsichere Authentifizierungs-, Geräte- oder Ursprungsschalter der Control UI | Auf `false` setzen, um Schalter für eine unsichere Exposition der Control UI zu verweigern. |
| `gateway.remote.allow`                  | Remote-Gateway-Modus/-Konfiguration            | Auf `false` setzen, um den Remote-Gateway-Modus zu verweigern.                     |
| `gateway.http.denyEndpoints`            | Gateway-HTTP-API-Endpunkte                     | Endpunkt-IDs wie `chatCompletions` oder `responses` verweigern.                    |
| `gateway.http.requireUrlAllowlists`      | URL-Abrufeingaben der Gateway-HTTP-API         | Auf `true` setzen, um URL-Zulassungslisten für URL-Abrufeingaben zu verlangen.     |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | Verlangen, dass exakte Node-Befehls-IDs wie `system.run` in der OpenClaw-Konfiguration verweigert werden. |

`gateway.nodes.denyCommands` ist eine exakte, groß-/kleinschreibungssensitive
Verweigerungs-Obermengenregel. Verwenden Sie sie, wenn die Richtlinie nachweisen
muss, dass privilegierte Node-Befehle durch die OpenClaw-Konfiguration explizit
verweigert werden. Eine Bereitstellung, die einen privilegierten Node-Befehl
absichtlich zulässt, sollte nach der Prüfung `policy.jsonc` aktualisieren,
anstatt sich ausschließlich auf `gateway.nodes.allowCommands` zu verlassen.

#### Agent-Arbeitsbereich

| Richtlinienfeld                  | Beobachteter Zustand                                                                 | Verwenden, wenn                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` und `agents.list[].sandbox.workspaceAccess` | Nur Sandbox-Arbeitsbereichszugriffswerte wie `none` oder `ro` zulässig sein sollen.       |
| `agents.workspace.denyTools`     | Globale und agentspezifische Konfiguration zur Verweigerung von Tools                | Mutations-Tools (`exec`, `process`, `write`, `edit`, `apply_patch`) verweigert werden müssen. |

#### Sandbox-Sicherheitsstatus

| Richtlinienfeld                                      | Beobachteter Zustand                                    | Verwenden, wenn                                                    |
| ---------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` und agentspezifischer Modus | Nur geprüfte Sandbox-Modi wie `all` oder `non-main` zulässig sein sollen. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` und agentspezifisches Backend | Nur geprüfte Sandbox-Backends wie `docker` zulässig sein sollen. |
| `sandbox.containers.denyHostNetwork`                  | Netzwerkmodus einer containerbasierten Sandbox/eines containerbasierten Browsers | Der Host-Netzwerkmodus verweigert werden soll. |
| `sandbox.containers.denyContainerNamespaceJoin`       | Netzwerkmodus einer containerbasierten Sandbox/eines containerbasierten Browsers | Der Beitritt zum Netzwerk-Namespace eines anderen Containers verweigert werden soll. |
| `sandbox.containers.requireReadOnlyMounts`            | Einbindungsmodus einer containerbasierten Sandbox/eines containerbasierten Browsers | Schreibgeschützte Einbindungen erforderlich sein sollen. |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Einbindungsziele einer containerbasierten Sandbox/eines containerbasierten Browsers | Einbindungen von Container-Runtime-Sockets verweigert werden sollen. |
| `sandbox.containers.denyUnconfinedProfiles`           | Sicherheitsstatus des Container-Sicherheitsprofils      | Uneingeschränkte Container-Sicherheitsprofile verweigert werden sollen. |
| `sandbox.browser.requireCdpSourceRange`                | CDP-Quellbereich des Sandbox-Browsers                   | Für die CDP-Exposition des Browsers ein Quellbereich angegeben werden muss. |

Die Richtlinie behandelt einen fehlenden Wert für `sandbox.mode` als dessen
impliziten Standardwert `off`, sodass `sandbox.requireMode` eine neue oder nicht
konfigurierte Sandbox als außerhalb einer Zulassungsliste wie `["all"]` meldet.

#### Datenverarbeitung

| Richtlinienfeld                                     | Beobachteter Zustand                                                                | Verwenden, wenn                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                           | Auf `true` setzen, um `logging.redactSensitive: "off"` abzulehnen.            |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                   | Auf `true` setzen, um die Erfassung von Inhalten durch Telemetrie abzulehnen. |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                          | Auf `true` setzen, um den effektiven Sitzungswartungsmodus `enforce` zu verlangen. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` und `agents.*.memorySearch.experimental.sessionMemory` | Auf `true` setzen, um die Indizierung von Sitzungstranskripten im Speicher abzulehnen. |

#### Geheimnisse

| Richtlinienfeld                   | Beobachteter Zustand                                       | Verwenden, wenn                                                                  |
| --------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs der Konfiguration und Deklarationen unter `secrets.providers.*` | Auf `true` setzen, damit SecretRefs auf deklarierte Provider verweisen müssen.   |
| `secrets.denySources`             | Quellen von Geheimnis-Providern und SecretRef-Quellen      | Quellen wie `exec`, `file` oder einen anderen konfigurierten Quellennamen verweigern. |
| `secrets.allowInsecureProviders`  | Sicherheitsstatus-Schalter für unsichere Geheimnis-Provider | Auf `false` setzen, um Provider abzulehnen, die einen unsicheren Sicherheitsstatus aktivieren. |

#### Exec-Genehmigungen

Prüfungen der Exec-Genehmigungen lesen das Runtime-Artefakt
`exec-approvals.json`: standardmäßig `~/.openclaw/exec-approvals.json` oder
`$OPENCLAW_STATE_DIR/exec-approvals.json`, wenn `OPENCLAW_STATE_DIR` gesetzt ist.
Sicherheitsstatusregeln unter `execApprovals.defaults.*` oder
`execApprovals.agents.*` erfordern lesbare Artefaktnachweise; ein fehlendes oder
ungültiges Artefakt wird als nicht beobachtbarer Nachweis gemeldet und nicht
nach bestem Bemühen als bestanden gewertet. Sobald es lesbar ist, übernehmen
ausgelassene Felder die Runtime-Standardwerte: Ein fehlender Wert für
`defaults.security` ist `full`, und eine fehlende Agent-Sicherheit übernimmt
diesen Standardwert. Der Nachweis umfasst `defaults`, `agents.*`,
`agents.*.allowlist[].pattern`, optional `argPattern`, den effektiven
`autoAllowSkills`-Sicherheitsstatus und die Eintragsquelle – niemals
Socket-Pfad/-Token, `commandText`, `lastUsedCommand`, aufgelöste Pfade oder
Zeitstempel.

| Richtlinienfeld                              | Beobachteter Zustand                                                                  | Verwenden, wenn                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                  | Pfad der aktiven Runtime-Datei `exec-approvals.json`                                  | Auf `true` setzen, damit das Genehmigungsartefakt vorhanden und syntaktisch gültig sein muss. |
| `execApprovals.defaults.allowSecurity`       | `defaults.security`, mit dem Standardwert `full`                                      | Nur genehmigte Standardsicherheitsmodi für Genehmigungen zulässig sein sollen.          |
| `execApprovals.agents.allowSecurity`         | `agents.*.security`, übernimmt die Standardwerte                                      | Nur genehmigte effektive agentspezifische Sicherheitsmodi für Genehmigungen zulässig sein sollen. |
| `execApprovals.agents.allowAutoAllowSkills`  | `defaults.autoAllowSkills` und `agents.*.autoAllowSkills`, übernehmen Runtime-Standardwerte | Auf `false` setzen, um strikte manuelle Zulassungslisten ohne implizite CLI-Genehmigung für Skills zu verlangen. |
| `execApprovals.agents.allowlist.expected`    | Zusammengefasste Muster- und optionale argPattern-Einträge aus `agents.*.allowlist[]` | Die Genehmigungs-Zulassungsliste mit dem geprüften Mustersatz übereinstimmen muss.       |

Beispiel: Das Genehmigungsartefakt verlangen, freizügige Standardwerte
verweigern und nur den geprüften Sicherheitsstatus für Exec-Genehmigungen
ausgewählter Agents zulassen.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Sicherheitsmodi: "deny", "allowlist" oder "full".
      // Diese Standardeinstellung erlaubt nur die strikt eingeschränkte Haltung "deny".
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Ausgewählte Agenten dürfen die geprüfte Haltung "allowlist" verwenden, jedoch nicht "full".
          "allowSecurity": ["allowlist"],
          // false bedeutet, dass Skill-CLIs in der geprüften Positivliste enthalten sein müssen,
          // statt durch autoAllowSkills implizit genehmigt zu werden.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Einfacher Eintrag: exakt geprüftes Muster für ausführbare Dateien ohne argPattern.
              "travel-hub",
              // Eingeschränkter Eintrag: Muster plus geprüfter regulärer Ausdruck für Argumente.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Authentifizierungsprofile

| Richtlinienfeld                 | Beobachteter Zustand                           | Verwendung                                                                                                      |
| ------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Provider- und Modusmetadaten von `auth.profiles.*` | Metadatenschlüssel wie `provider` und `mode` für Authentifizierungsprofile in der Konfiguration vorschreiben. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                         | Nur unterstützte Modi für Authentifizierungsprofile wie `api_key`, `aws-sdk`, `oauth` oder `token` zulassen.  |

#### Werkzeugmetadaten

| Richtlinienfeld         | Beobachteter Zustand                  | Verwendung                                                                                          |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Verwaltete `TOOLS.md`-Deklarationen   | Für verwaltete Werkzeuge Metadatenschlüssel wie `risk`, `sensitivity` oder `owner` vorschreiben.   |

#### Werkzeughaltung

| Richtlinienfeld                 | Beobachteter Zustand                                          | Verwendung                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` und `agents.list[].tools.profile`             | Nur Werkzeugprofil-IDs wie `minimal`, `messaging` oder `coding` zulassen.                                                         |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` und agentenspezifische `tools.fs`-Überschreibungen | Auf `true` setzen, um für Dateisystemwerkzeuge eine ausschließlich auf den Arbeitsbereich beschränkte Haltung vorzuschreiben. |
| `tools.exec.allowSecurity`      | `tools.exec.security` und agentenspezifische Ausführungssicherheit | Nur Sicherheitsmodi für die Ausführung wie `deny` oder `allowlist` zulassen.                                                   |
| `tools.exec.requireAsk`         | `tools.exec.ask` und agentenspezifischer Abfragemodus für die Ausführung | Eine Genehmigungshaltung wie `always` vorschreiben.                                                                          |
| `tools.exec.allowHosts`         | `tools.exec.host` und agentenspezifisches Ausführungs-Host-Routing | Nur Routingmodi für Ausführungs-Hosts wie `sandbox` zulassen.                                                                |
| `tools.elevated.allow`          | `tools.elevated.enabled` und agentenspezifische privilegierte Haltung | Auf `false` setzen, damit der privilegierte Werkzeugmodus deaktiviert bleiben muss.                                          |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` und agentenspezifisches `tools.alsoAllow`   | Exakte `alsoAllow`-Einträge vorschreiben und fehlende oder unerwartete zusätzliche Werkzeugfreigaben melden.                        |
| `tools.denyTools`               | `tools.deny` und `agents.list[].tools.deny`                   | Vorschreiben, dass konfigurierte Werkzeug-Sperrlisten Werkzeug-IDs oder Gruppen wie `group:runtime` und `group:fs` enthalten.       |

## Prüfungen ausführen

Führen Sie während der Erstellung ausschließlich Richtlinienprüfungen aus:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` führt nur den Satz von Richtlinienprüfungen aus und gibt Nachweise, Feststellungen
und Attestierungshashes aus. Dieselben Feststellungen erscheinen auch in
`openclaw doctor --lint`, wenn das Policy-Plugin aktiviert ist.

Vergleichen Sie eine Richtliniendatei eines Betreibers mit einer erstellten Baseline:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` prüft die Syntax einer Richtliniendatei gegen die Syntax einer anderen Richtliniendatei;
Laufzeitzustand, Nachweise, Anmeldedaten oder Geheimnisse werden nicht geprüft. Es verwendet dieselben
Regelmetadaten, die bereichsbezogene Überlagerungen steuern: Positivlisten müssen gleich bleiben oder
enger werden, Sperrlisten müssen gleich bleiben oder weiter werden, vorgeschriebene boolesche Werte müssen
ihren Wert beibehalten, geordnete Zeichenfolgen dürfen sich nur zum strengeren Ende der
konfigurierten Reihenfolge bewegen und exakte Listen müssen übereinstimmen. Die Baseline kann eine
von der Organisation erstellte Richtlinie sein; die geprüfte Richtlinie darf strengere Werte oder
zusätzliche Regeln hinzufügen. Eine geprüfte Regel auf oberster Ebene kann eine bereichsbezogene Baseline-Regel erfüllen, wenn
sie genauso restriktiv oder restriktiver ist. Bereichsnamen müssen zwischen den
Dateien nicht übereinstimmen; der Vergleich erfolgt anhand von Selektor (`agentIds`/`channelIds`) und Feld.

Erfolgreicher Vergleich (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Die erfolgreiche Ausgabe von `policy check --json` enthält stabile Hashes, die ein Betreiber oder
Supervisor aufzeichnen kann:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Richtlinie konfigurieren

Die Richtlinienkonfiguration befindet sich unter `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Einstellung               | Zweck                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `enabled`                 | Richtlinienprüfungen aktivieren, noch bevor `policy.jsonc` vorhanden ist.               |
| `workspaceRepairs`        | `doctor --fix` erlauben, richtlinienverwaltete Arbeitsbereichseinstellungen zu bearbeiten. |
| `expectedHash`            | Optionale Hash-Sperre für das genehmigte Richtlinienartefakt.                           |
| `expectedAttestationHash` | Optionale Hash-Sperre für die zuletzt akzeptierte erfolgreiche Richtlinienprüfung.      |
| `path`                    | Relativ zum Arbeitsbereich angegebener Speicherort des Richtlinienartefakts.            |

Setzen Sie `plugins.entries.policy.config.enabled` auf `false`, um Richtlinienprüfungen
für einen Arbeitsbereich zu deaktivieren, während das Plugin installiert bleibt.

## Richtlinienzustand akzeptieren

Beispielhafte JSON-Ausgabe:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` identifiziert das erstellte Regelartefakt. `evidence`
zeichnet den von den Prüfungen verwendeten beobachteten OpenClaw-Zustand auf, und
`workspace.hash` identifiziert diese Nachweisnutzlast. `findingsHash` identifiziert
die exakte Feststellungsmenge. `checkedAt` zeichnet auf, wann die Prüfung ausgeführt wurde.
`attestationHash` identifiziert die stabile Aussage (Richtlinienhash, Nachweishash,
Feststellungshash und erfolgreicher/fehlerhafter Zustand) und schließt `checkedAt` bewusst aus,
sodass derselbe Richtlinienzustand immer denselben Attestierungshash erzeugt. Zusammen
bilden diese vier Werte das Audit-Tupel für eine Richtlinienprüfung.

Wenn ein Gateway oder Supervisor Richtlinien verwendet, um eine Laufzeitaktion zu blockieren, zu genehmigen oder mit Anmerkungen zu versehen,
sollte der Attestierungshash der letzten erfolgreichen
Prüfung aufgezeichnet werden. `checkedAt` bleibt für Audit-Protokolle in der JSON-Ausgabe enthalten, ist jedoch nicht Teil des
stabilen Hashes.

Lebenszyklus zum Akzeptieren des Richtlinienzustands:

1. Erstellen oder prüfen Sie `policy.jsonc`.
2. Führen Sie `openclaw policy check --json` aus.
3. Wenn die Prüfung erfolgreich ist, zeichnen Sie `attestation.policy.hash` als `expectedHash` auf.
4. Zeichnen Sie `attestation.attestationHash` als `expectedAttestationHash` auf.
5. Führen Sie `openclaw doctor --lint` in CI- oder Release-Gates erneut aus.

Wenn sich Richtlinienregeln absichtlich ändern, aktualisieren Sie beide akzeptierten Hashes anhand einer
sauberen Prüfung. Wenn sich nur die Workspace-Einstellungen ändern (die Richtlinie bleibt gleich),
ändert sich normalerweise nur `expectedAttestationHash`.

Das Aktivieren oder Aktualisieren von `agents.workspace`-Regeln fügt dem Workspace-Hash
und dem Attestierungs-Hash `agentWorkspace`-Nachweise hinzu. Prüfen Sie die neuen Nachweise und
aktualisieren Sie nach der Aktivierung die akzeptierten Attestierungs-Hashes. Das Aktivieren oder Aktualisieren
von Regeln für die Tool-Sicherheitskonfiguration fügt auf dieselbe Weise `toolPosture`-Nachweise hinzu.

`openclaw policy watch` führt die Prüfung erneut aus und meldet, wenn die aktuellen Nachweise
nicht mehr mit `expectedAttestationHash` übereinstimmen:

```bash
openclaw policy watch --json
```

Verwenden Sie `--once` in CI oder Skripten, die eine einmalige Abweichungsprüfung benötigen. Ohne
`--once` erfolgt die Abfrage standardmäßig alle zwei Sekunden. Verwenden Sie `--interval-ms`, um
das Intervall zu ändern.

## Feststellungen

| Prüf-ID                                                   | Feststellung                                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                             | Die Richtlinie ist aktiviert, aber `policy.jsonc` fehlt.                                                            |
| `policy/policy-jsonc-invalid`                             | Die Richtlinie kann nicht analysiert werden oder enthält fehlerhafte Regeleinträge.                                 |
| `policy/policy-hash-mismatch`                             | Die Richtlinie stimmt nicht mit dem konfigurierten `expectedHash` überein.                                           |
| `policy/attestation-hash-mismatch`                        | Die aktuellen Richtliniennachweise stimmen nicht mehr mit der akzeptierten Attestierung überein.                    |
| `policy/policy-conformance-invalid`                       | Eine Basisrichtliniendatei oder eine geprüfte Richtliniendatei weist eine ungültige Vergleichssyntax auf.           |
| `policy/policy-conformance-missing`                       | In einer geprüften Richtliniendatei fehlt eine Regel, die von der Basisrichtliniendatei vorgeschrieben wird.         |
| `policy/policy-conformance-weaker`                        | Eine geprüfte Richtliniendatei enthält einen schwächeren Wert als die Basisrichtliniendatei.                        |
| `policy/channels-denied-provider`                         | Ein aktivierter Kanal entspricht einer Kanal-Ablehnungsregel.                                                       |
| `policy/mcp-denied-server`                                | Ein konfigurierter MCP-Server wird von der Richtlinie abgelehnt.                                                    |
| `policy/mcp-unapproved-server`                            | Ein konfigurierter MCP-Server befindet sich außerhalb der Zulassungsliste.                                          |
| `policy/models-denied-provider`                           | Ein konfigurierter Modell-Provider oder eine Modellreferenz verwendet einen abgelehnten Provider.                   |
| `policy/models-unapproved-provider`                       | Ein konfigurierter Modell-Provider oder eine Modellreferenz befindet sich außerhalb der Zulassungsliste.            |
| `policy/network-private-access-enabled`                   | Eine SSRF-Ausnahmeregel für private Netzwerke ist aktiviert, obwohl die Richtlinie sie untersagt.                    |
| `policy/ingress-dm-policy-unapproved`                     | Eine DM-Richtlinie eines Kanals befindet sich außerhalb der Richtlinien-Zulassungsliste.                             |
| `policy/ingress-dm-scope-unapproved`                      | `session.dmScope` entspricht nicht dem von der Richtlinie vorgeschriebenen DM-Isolationsbereich.                    |
| `policy/ingress-open-groups-denied`                       | Eine Kanalgruppenrichtlinie ist `open`, obwohl die Richtlinie offenen Gruppeneingang untersagt.                     |
| `policy/ingress-group-mention-required`                   | Ein Kanal- oder Gruppeneintrag deaktiviert Erwähnungssperren, obwohl die Richtlinie sie vorschreibt.                 |
| `policy/gateway-non-loopback-bind`                        | Die Gateway-Bindungskonfiguration erlaubt eine Nicht-Loopback-Exposition, obwohl die Richtlinie sie untersagt.       |
| `policy/gateway-auth-disabled`                            | Die Gateway-Authentifizierung ist deaktiviert, obwohl die Richtlinie Authentifizierung vorschreibt.                 |
| `policy/gateway-rate-limit-missing`                       | Die Konfiguration der Gateway-Authentifizierungsratenbegrenzung ist nicht explizit, obwohl die Richtlinie dies verlangt. |
| `policy/gateway-control-ui-insecure`                      | Schalter für eine unsichere Exposition der Gateway Control UI sind aktiviert.                                      |
| `policy/gateway-tailscale-funnel`                         | Die Exposition über Gateway Tailscale Funnel ist aktiviert, obwohl die Richtlinie sie untersagt.                    |
| `policy/gateway-remote-enabled`                           | Der Gateway-Remote-Modus ist aktiv, obwohl die Richtlinie ihn untersagt.                                            |
| `policy/gateway-http-endpoint-enabled`                    | Ein Gateway-HTTP-API-Endpunkt ist aktiviert, obwohl die Richtlinie ihn untersagt.                                   |
| `policy/gateway-http-url-fetch-unrestricted`              | Für die URL-Abrufeingabe der Gateway-HTTP-API fehlt eine vorgeschriebene URL-Zulassungsliste.                       |
| `policy/gateway-node-command-denied`                      | Ein von der Richtlinie abgelehnter Node-Befehl wird von der OpenClaw-Konfiguration nicht abgelehnt.                 |
| `policy/agents-workspace-access-denied`                   | Der Agent-Sandbox-Modus oder der Workspace-Zugriff befindet sich außerhalb der Richtlinien-Zulassungsliste.         |
| `policy/agents-tool-not-denied`                           | Eine Agent- oder Standardkonfiguration lehnt ein von der Richtlinie vorgeschriebenes Tool nicht ab.                 |
| `policy/tools-profile-unapproved`                         | Ein konfiguriertes globales oder agentspezifisches Tool-Profil befindet sich außerhalb der Zulassungsliste.         |
| `policy/tools-fs-workspace-only-required`                 | Dateisystem-Tools sind nicht mit einer ausschließlich auf den Workspace beschränkten Pfadkonfiguration eingerichtet. |
| `policy/tools-exec-security-unapproved`                   | Der Exec-Sicherheitsmodus befindet sich außerhalb der Richtlinien-Zulassungsliste.                                  |
| `policy/tools-exec-ask-unapproved`                        | Der Exec-Abfragemodus befindet sich außerhalb der Richtlinien-Zulassungsliste.                                      |
| `policy/tools-exec-host-unapproved`                       | Das Exec-Host-Routing befindet sich außerhalb der Richtlinien-Zulassungsliste.                                      |
| `policy/tools-elevated-enabled`                           | Der erweiterte Tool-Modus ist aktiviert, obwohl die Richtlinie ihn untersagt.                                       |
| `policy/tools-also-allow-missing`                         | In einer konfigurierten `alsoAllow`-Liste fehlt ein von der Richtlinie vorgeschriebener Eintrag.                    |
| `policy/tools-also-allow-unexpected`                      | Eine konfigurierte `alsoAllow`-Liste enthält einen von der Richtlinie nicht erwarteten Eintrag.                     |
| `policy/tools-required-deny-missing`                      | Eine globale oder agentspezifische Tool-Ablehnungsliste enthält ein vorgeschriebenes abgelehntes Tool nicht.        |
| `policy/sandbox-mode-unapproved`                          | Der Sandbox-Modus befindet sich außerhalb der Richtlinien-Zulassungsliste.                                          |
| `policy/sandbox-backend-unapproved`                       | Das Sandbox-Backend befindet sich außerhalb der Richtlinien-Zulassungsliste.                                        |
| `policy/sandbox-container-posture-unobservable`           | Eine Container-Konfigurationsregel ist für ein Backend aktiviert, das sie nicht beobachten kann.                   |
| `policy/sandbox-container-host-network-denied`            | Eine containerbasierte Sandbox oder ein containerbasierter Browser verwendet den Hostnetzwerkmodus.                |
| `policy/sandbox-container-namespace-join-denied`          | Eine containerbasierte Sandbox oder ein containerbasierter Browser tritt dem Namespace eines anderen Containers bei. |
| `policy/sandbox-container-mount-mode-required`            | Eine Einbindung einer containerbasierten Sandbox oder eines containerbasierten Browsers ist nicht schreibgeschützt. |
| `policy/sandbox-container-runtime-socket-mount`           | Eine Einbindung einer containerbasierten Sandbox oder eines containerbasierten Browsers legt den Container-Runtime-Socket offen. |
| `policy/sandbox-container-unconfined-profile`             | Das Container-Sandbox-Profil ist uneingeschränkt, obwohl die Richtlinie dies untersagt.                             |
| `policy/sandbox-browser-cdp-source-range-missing`         | Der CDP-Quellbereich des Sandbox-Browsers fehlt, obwohl die Richtlinie einen vorschreibt.                            |
| `policy/data-handling-redaction-disabled`                 | Die Schwärzung sensibler Protokolldaten ist deaktiviert, obwohl die Richtlinie sie vorschreibt.                     |
| `policy/data-handling-telemetry-content-capture`          | Die Erfassung von Telemetrieinhalten ist aktiviert, obwohl die Richtlinie sie untersagt.                            |
| `policy/data-handling-session-retention-not-enforced`     | Die Wartung der Sitzungsaufbewahrung wird nicht durchgesetzt, obwohl die Richtlinie dies vorschreibt.               |
| `policy/data-handling-session-transcript-memory-enabled`  | Die Speicherindizierung von Sitzungstranskripten ist aktiviert, obwohl die Richtlinie sie untersagt.                |
| `policy/secrets-unmanaged-provider`                       | Eine SecretRef der Konfiguration verweist auf einen Provider, der nicht unter `secrets.providers` deklariert ist.   |
| `policy/secrets-denied-provider-source`                   | Ein Geheimnis-Provider der Konfiguration oder eine SecretRef verwendet eine von der Richtlinie abgelehnte Quelle.   |
| `policy/secrets-insecure-provider`                        | Ein Geheimnis-Provider aktiviert eine unsichere Konfiguration, obwohl die Richtlinie sie untersagt.                 |
| `policy/auth-profile-invalid-metadata`                    | In einem Authentifizierungsprofil der Konfiguration fehlen gültige Provider- oder Modusmetadaten.                   |
| `policy/auth-profile-unapproved-mode`                     | Der Modus eines Authentifizierungsprofils der Konfiguration befindet sich außerhalb der Richtlinien-Zulassungsliste. |
| `policy/exec-approvals-missing`                           | Die Richtlinie schreibt `exec-approvals.json` vor, aber das Artefakt fehlt.                                         |
| `policy/exec-approvals-invalid`                           | Das konfigurierte Exec-Genehmigungsartefakt kann nicht analysiert werden.                                           |
| `policy/exec-approvals-default-security-unapproved`       | Die Standardwerte für Exec-Genehmigungen verwenden einen Sicherheitsmodus außerhalb der Richtlinien-Zulassungsliste. |
| `policy/exec-approvals-agent-security-unapproved`         | Ein effektiver agentspezifischer Sicherheitsmodus für Exec-Genehmigungen befindet sich außerhalb der Zulassungsliste. |
| `policy/exec-approvals-auto-allow-skills-enabled`         | Ein Exec-Genehmigungsagent lässt Skills-CLIs implizit automatisch zu, obwohl die Richtlinie dies untersagt.         |
| `policy/exec-approvals-allowlist-missing`                 | In der Genehmigungs-Zulassungsliste fehlt ein von der Richtlinie vorgeschriebenes Muster.                           |
| `policy/exec-approvals-allowlist-unexpected`              | Die Genehmigungs-Zulassungsliste enthält ein von der Richtlinie nicht erwartetes Muster.                            |
| `policy/tools-missing-risk-level`                         | In einer kontrollierten Tool-Deklaration fehlen Risikometadaten.                                                    |
| `policy/tools-unknown-risk-level`                         | Eine kontrollierte Tool-Deklaration verwendet einen unbekannten Risikowert.                                        |
| `policy/tools-missing-sensitivity-token`                  | In einer kontrollierten Tool-Deklaration fehlen Sensitivitätsmetadaten.                                             |
| `policy/tools-missing-owner`                              | In einer kontrollierten Tool-Deklaration fehlen Eigentümermetadaten.                                                |
| `policy/tools-unknown-sensitivity-token`                  | Eine kontrollierte Tool-Deklaration verwendet einen unbekannten Sensitivitätswert.                                 |

Eine Feststellung kann sowohl `target` (das beobachtete Workspace-Element, das
nicht konform ist) als auch `requirement` (die verfasste Regel, die zur Feststellung
geführt hat) enthalten. Beide sind derzeit `oc://`-Adresszeichenfolgen, die Feldnamen
beschreiben jedoch die Richtlinienrolle und nicht das Adressformat.

Beispiele für Feststellungen:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Der Kanal 'telegram' verwendet den abgelehnten Provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram ist für diesen Workspace nicht genehmigt."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "Das Tool 'deploy' aus TOOLS.md hat keine explizite Risikoklassifizierung.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "Der MCP-Server 'remote' befindet sich nicht auf der Richtlinien-Zulassungsliste.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Die Modellreferenz 'anthropic/claude-sonnet-4.7' verwendet den nicht genehmigten Provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Die Netzwerkeinstellung 'browser-private-network' erlaubt den Zugriff auf private Netzwerke.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Die Gateway-Bindungseinstellung 'gateway-bind' erlaubt die Erreichbarkeit über Nicht-Loopback-Adressen.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Der Gateway-Node-Befehl 'system.run' wird von der Richtlinie verweigert, aber nicht von der OpenClaw-Konfiguration.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Fügen Sie 'system.run' zu gateway.nodes.denyCommands hinzu oder aktualisieren Sie die Richtlinie nach der Überprüfung."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "Der Sandbox-Arbeitsbereichszugriff 'rw' von agents.defaults ist laut Richtlinie nicht zulässig.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Reparatur

`doctor --lint` und `policy check` sind schreibgeschützt.

`doctor --fix` bearbeitet richtlinienverwaltete Arbeitsbereichseinstellungen nur, wenn
`workspaceRepairs` ausdrücklich aktiviert ist; andernfalls melden die Prüfungen, was sie
reparieren würden, und lassen die Einstellungen unverändert.

In dieser Version kann die Reparatur von `channels.denyRules` verweigerte Kanäle deaktivieren und
die unten aufgeführten automatischen Einschränkungsreparaturen anwenden. Aktivieren Sie
`workspaceRepairs` erst, nachdem die Richtliniendatei überprüft wurde, da eine gültige Regel die
Arbeitsbereichskonfiguration ändern kann:

- `tools.elevated.enabled=false` festlegen, wenn eine globale Richtlinie privilegierte Tools verbietet
- fehlende zwingend zu verweigernde Tool-IDs zu `tools.deny` oder
  `agents.list[].tools.deny` hinzufügen, wenn die Richtlinie verlangt, dass diese Tools verweigert werden
- unsichere Schalter unter `gateway.controlUi.*` auf `false` setzen
- `gateway.mode=local` festlegen, wenn die Richtlinie den Remote-Gateway-Modus verweigert
- gemeldete Pfade unter `gateway.http.endpoints.*.enabled` auf `false` setzen, wenn die Richtlinie
  Gateway-HTTP-API-Endpunkte verweigert
- gemeldete `groupPolicy`-Pfade für eingehende Kanalnachrichten auf `allowlist` setzen, wenn die Richtlinie
  offenen Gruppenzugriff verweigert
- gemeldete `requireMention`-Pfade für eingehende Kanalnachrichten auf `true` setzen, wenn die Richtlinie
  Erwähnungen in Gruppen verlangt
- `logging.redactSensitive=tools` festlegen, wenn die Richtlinie das Schwärzen sensibler Protokolldaten
  verlangt
- `diagnostics.otel.captureContent=false` oder bei objektförmigen Einstellungen zur Erfassung von
  Telemetriedaten `diagnostics.otel.captureContent.enabled=false` festlegen, wenn die Richtlinie die
  Erfassung von Telemetrieinhalten verweigert

Bereichsspezifische Reparaturen für privilegierte Tools werden nur erkannt. Bereichsspezifische
Reparaturen der Datenverarbeitung werden ebenfalls übersprungen, wenn der Befund eine gemeinsam
genutzte Protokollierungs- oder Telemetriekonfiguration meldet, da eine Änderung der gemeinsamen
Einstellung mehr als das bereichsspezifische Richtlinienziel betreffen würde.

Bereichsspezifische Reparaturen zwingender Verweigerungen werden übersprungen, wenn der Befund das
geerbte Stammverzeichnis-`tools.deny` meldet, da das Hinzufügen des erforderlichen Tools zur
Stammkonfiguration mehr als das bereichsspezifische Richtlinienziel betreffen würde. Agent-lokale
Reparaturen zwingender Verweigerungen können den gemeldeten Pfad `agents.list[].tools.deny`
aktualisieren.

Bereichsspezifische Reparaturen eingehender Kanalnachrichten werden übersprungen, wenn der Befund
geerbte `channels.defaults.*` meldet, da eine Änderung des gemeinsam genutzten Kanalstandards mehr
als das bereichsspezifische Richtlinienziel betreffen würde. Befunde zur Gateway-HTTP-URL-Abruf-
Zulassungsliste bleiben manuell zu beheben, da die automatische Reparatur nicht die richtigen
Zulassungslistenwerte für Endpunkt-URLs auswählen kann.

Befunde zu Gateway-Bindungen und Node-Befehlen müssen weiterhin überprüft werden. Wenn
`policy/gateway-non-loopback-bind` oder `policy/gateway-node-command-denied`
einem Konfigurationspfad zugeordnet werden kann, meldet `doctor --fix` die vorgeschlagene Änderung
an `gateway.bind` oder `gateway.nodes.denyCommands` als übersprungene Vorschauempfehlung.
Die Änderung wird nicht angewendet, und der Befund gilt erst dann als repariert, wenn ein Operator
die Konfiguration oder Richtlinie überprüft und aktualisiert hat.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Exit-Codes

| Befehl           | `0`                                                            | `1`                                                                         | `2`                              |
| ---------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------- |
| `policy check`   | Keine Befunde ab dem Schwellenwert.                            | Mindestens ein Befund hat den Schwellenwert erreicht.                       | Argument- oder Laufzeitfehler.   |
| `policy compare` | Die Richtliniendatei ist mindestens so streng wie die Baseline. | Die Richtliniendatei ist ungültig, fehlt oder ist schwächer als die Baseline-Regeln. | Argument- oder Laufzeitfehler.   |
| `policy watch`   | Keine Befunde, und der akzeptierte Hash ist aktuell.           | Es liegen Befunde vor oder die akzeptierte Bestätigung ist veraltet.        | Argument- oder Laufzeitfehler.   |

## Verwandte Themen

- [Doctor-Lint-Modus](/de/cli/doctor#lint-mode)
- [Pfad-CLI](/de/cli/path)
