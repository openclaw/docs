---
read_when:
    - Sie möchten die OpenClaw-Einstellungen anhand einer erstellten `policy.jsonc` überprüfen.
    - Sie möchten Richtlinienbefunde bei der Doctor-Prüfung sehen
    - Sie benötigen einen Hash der Richtlinienbestätigung als Auditnachweis.
summary: CLI-Referenz für `openclaw policy`-Konformitätsprüfungen
title: Richtlinie
x-i18n:
    generated_at: "2026-07-12T01:29:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` wird durch das gebündelte Policy-Plugin bereitgestellt. Es ist eine unternehmensweite Konformitätsschicht über den bestehenden OpenClaw-Einstellungen und kein zweites Konfigurationssystem. Sie definieren Anforderungen in `policy.jsonc`; OpenClaw erfasst den aktiven Arbeitsbereich als Nachweis; Policy meldet Abweichungen über `doctor --lint`. Policy erzwingt keine Tool-Aufrufe und schreibt das Laufzeitverhalten nicht zur Anfragezeit um. Außerdem attestiert es keine agentenspezifischen Anmeldedatenspeicher wie `auth-profiles.json`.

Policy prüft konfigurierte Kanäle, MCP-Server, Modell-Provider, den Netzwerk-SSRF-Sicherheitsstatus, den Eingangs-/Kanalzugriff, die Gateway-Exposition und den Sicherheitsstatus von Node-Befehlen, den Zugriff von Agenten auf Arbeitsbereiche, den Sandbox-Sicherheitsstatus, den Datenverarbeitungsstatus, den Sicherheitsstatus von Secret-Providern und Authentifizierungsprofilen sowie Metadaten verwalteter Tools (`TOOLS.md`). Verwenden Sie es, wenn ein Arbeitsbereich eine dauerhafte, überprüfbare Vorgabe benötigt, etwa „Telegram darf nicht aktiviert sein“ oder „Verwaltete Tools müssen Risiko- und Verantwortlichenmetadaten deklarieren“. Wenn Sie lediglich lokales Verhalten ohne Attestierung oder Abweichungserkennung benötigen, genügt die normale Konfiguration.

## Schnellstart

```bash
openclaw plugins enable policy
```

Das Plugin bleibt auch dann aktiviert, wenn `policy.jsonc` fehlt, sodass Doctor das fehlende Artefakt melden kann, anstatt Prüfungen stillschweigend zu überspringen.

Erstellen Sie `policy.jsonc` manuell; sie wird nicht aus den aktuellen Einstellungen generiert. Jeder Abschnitt auf oberster Ebene ist ein Regel-Namensraum: Eine Prüfung wird nur ausgeführt, wenn darunter eine konkrete Regel vorhanden ist (nicht unterstützte Abschnitte oder Schlüssel führen zu `policy/policy-jsonc-invalid`, anstatt stillschweigend ignoriert zu werden). Minimales Beispiel, das jeden unterstützten Abschnitt abdeckt:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
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

Abschnittsübergreifende Hinweise, die aus den nachfolgenden Regeltabellen nicht unmittelbar hervorgehen:

- Wenn Sie `gateway.bind` weglassen und gleichzeitig Bindungen außerhalb von local loopback verbieten, akzeptieren Sie den Laufzeitstandard; legen Sie für strikte Konformität `gateway.bind: "loopback"` fest.
- Legen Sie für einen schreibgeschützten Agenten den Sandbox-`mode` in den zutreffenden Standardwerten bzw. beim Agenten auf `all` oder `non-main` und `workspaceAccess` auf `none` oder `ro` fest. Ein fehlender oder auf `off` gesetzter Sandbox-Modus erfüllt keine Schreibschutz-Policy.
- `agents.workspace.denyTools` akzeptiert `exec`, `process`, `write`, `edit`, `apply_patch`. Die Tool-Verweigerungsgruppen `group:fs` (Dateiänderungen) und `group:runtime` (Shell/Prozess) in der Konfiguration erfüllen den entsprechenden Sicherheitsstatus.
- Prüfungen von Ausführungsgenehmigungen lesen das aktive Artefakt `exec-approvals.json` nur, wenn eine `execApprovals`-Regel vorhanden ist; ein fehlendes oder ungültiges Artefakt ist ein nicht beobachtbarer Nachweis und kein konstruierter erfolgreicher Prüflauf.
- Nachweise für Secrets und Authentifizierungsprofile erfassen ausschließlich den Provider-/Quellenstatus und SecretRef-Metadaten, niemals Rohwerte. Policy liest oder attestiert keine agentenspezifischen Anmeldedatenspeicher wie `auth-profiles.json`.
- Nachweise zur Datenverarbeitung bilden ausschließlich den Sicherheitsstatus auf Konfigurationsebene ab (Schwärzungsmodus, Umschalter für Telemetrieerfassung, Sitzungswartungsmodus und Einstellung zur Transkriptindizierung). Sie prüfen keine Protokolle, Telemetrieexporte, Transkripte oder Memory-Dateien. Ein einwandfreies Ergebnis beweist nicht, dass diese keine personenbezogenen Daten oder Secrets enthalten.

### Referenz der Policy-Regeln

Jede nachfolgende Regel ist optional; eine Prüfung wird nur ausgeführt, wenn die Regel vorhanden ist. Der beobachtete Zustand entspricht der bestehenden OpenClaw-Konfiguration oder den Metadaten des Arbeitsbereichs.

#### Bereichsbezogene Überlagerungen

Verwenden Sie `scopes.<scopeName>`, wenn bestimmte Agenten oder Kanäle eine strengere Policy als die Basisvorgaben auf oberster Ebene benötigen. Der Bereichsname ist lediglich eine Bezeichnung; der Abgleich erfolgt anhand des Selektors innerhalb des Bereichs. Überlagerungen sind additiv: Die globale Regel wird weiterhin ausgeführt, und die bereichsbezogene Regel kann für denselben Nachweis einen eigenen Befund hinzufügen.

| Selektor     | Unterstützte Abschnitte                                                         | Verwendung                                                     |
| ------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Ein oder mehrere Laufzeitagenten benötigen strengere Regeln.   |
| `channelIds` | `ingress.channels`                                                              | Ein oder mehrere Kanäle benötigen strengere Eingangsregeln.    |

Wenn ein `agentIds`-Eintrag nicht in `agents.list[]` vorhanden ist, wertet OpenClaw die bereichsbezogene Regel anhand des geerbten globalen bzw. standardmäßigen Sicherheitsstatus für diese Laufzeitagenten-ID aus, anstatt sie zu überspringen.

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

Derselbe Agent kann wie oben in mehreren Bereichen vorkommen, wenn jeder Bereich ein anderes Feld regelt. Ein wiederholtes bereichsbezogenes Feld für denselben Agenten muss gleich streng oder strenger sein; eine schwächere doppelte Vorgabe wird abgelehnt (Positivlisten müssen Teilmengen, Sperrlisten Obermengen und erforderliche boolesche Werte unverändert sein).

Regeln zum Container-Sicherheitsstatus (`sandbox.containers.*`) werden nur anhand von Nachweisen geprüft, die das Sandbox-Backend des übereinstimmenden Agenten bereitstellen kann. Wenn ein Backend eine dafür aktivierte Regel nicht beobachten kann, meldet Policy `policy/sandbox-container-posture-unobservable`, anstatt die Prüfung als erfolgreich zu werten. Beschränken Sie Container-Regeln auf die Agentengruppen, die ein Backend verwenden, das diese Nachweise bereitstellen kann.

`ingress.session.requireDmScope` auf oberster Ebene bleibt global; `session.dmScope` ist kein einem Kanal zuordenbarer Nachweis und kann daher nicht über `channelIds` eingegrenzt werden.

Jeder in `policy.jsonc` vorhandene Bereich muss gültig und durchsetzbar sein.

#### Kanäle

| Policy-Feld                          | Beobachteter Zustand                   | Verwendung                                                          |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Provider und Aktivierungsstatus unter `channels.*` | Konfigurierte Kanäle eines Providers wie `telegram` verbieten. |
| `channels.denyRules[].reason`        | Kontext für Befundmeldung und Reparaturhinweis | Erklären, warum der Provider verboten ist.                    |

#### MCP-Server

| Policy-Feld        | Beobachteter Zustand | Verwendung                                                             |
| ------------------ | --------------------- | ---------------------------------------------------------------------- |
| `mcp.servers.allow` | IDs unter `mcp.servers.*` | Verlangen, dass jeder konfigurierte MCP-Server in einer Positivliste enthalten ist. |
| `mcp.servers.deny`  | IDs unter `mcp.servers.*` | Bestimmte konfigurierte MCP-Server-IDs verbieten.                   |

#### Modell-Provider

| Policy-Feld              | Beobachteter Zustand                                    | Verwendung                                                                                         |
| ------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `models.providers.allow` | IDs unter `models.providers.*` und ausgewählte Modellreferenzen | Verlangen, dass konfigurierte Provider und ausgewählte Modellreferenzen genehmigte Provider verwenden. |
| `models.providers.deny`  | IDs unter `models.providers.*` und ausgewählte Modellreferenzen | Konfigurierte Provider und ausgewählte Modellreferenzen anhand der Provider-ID verbieten.          |

#### Netzwerk

| Policy-Feld                   | Beobachteter Zustand                      | Verwendung                                                                   |
| ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `network.privateNetwork.allow` | SSRF-Ausweichmöglichkeiten für private Netzwerke | Auf `false` setzen, damit der Zugriff auf private Netzwerke deaktiviert bleiben muss. |

#### Eingangs- und Kanalzugriff

| Richtlinienfeld                           | Beobachteter Zustand                                          | Verwenden, wenn                                                        |
| ----------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                             | Ein geprüfter Isolationsbereich für Direktnachrichten erforderlich ist. |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` und veraltete DM-Richtlinienfelder für Kanäle | Nur geprüfte Kanalrichtlinien für Direktnachrichten zulässig sein sollen. |
| `ingress.channels.denyOpenGroups`         | Eingangsrichtlinie für Kanal, Konto und Gruppe                | Offener Gruppeneingang für konfigurierte Kanäle und Konten verweigert werden soll. |
| `ingress.channels.requireMentionInGroups` | Konfiguration der Erwähnungssperre für Kanal, Konto, Gruppe, Server und verschachtelte Ebenen | Erwähnungssperren erforderlich sein sollen, wenn der Gruppeneingang offen oder an Erwähnungen gebunden ist. |

#### Gateway

| Richtlinienfeld                         | Beobachteter Zustand                                   | Verwenden, wenn                                                                      |
| --------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                         | Auf `false` setzen, um eine Gateway-Bindung an loopback zu verlangen.                |
| `gateway.exposure.allowTailscaleFunnel` | Gateway-Konfiguration für Tailscale Serve/Funnel       | Auf `false` setzen, um die Offenlegung über Tailscale Funnel zu verweigern.           |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                                    | Auf `true` setzen, um deaktivierte Gateway-Authentifizierung abzulehnen.              |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                               | Auf `true` setzen, um eine explizite Konfiguration der Authentifizierungsratenbegrenzung zu verlangen. |
| `gateway.controlUi.allowInsecure`       | Unsichere Authentifizierungs-, Geräte- und Ursprungsschalter der Steuerungsoberfläche | Auf `false` setzen, um Schalter für die unsichere Offenlegung der Steuerungsoberfläche zu verweigern. |
| `gateway.remote.allow`                  | Remote-Gateway-Modus/-Konfiguration                    | Auf `false` setzen, um den Remote-Gateway-Modus zu verweigern.                        |
| `gateway.http.denyEndpoints`            | HTTP-API-Endpunkte des Gateways                         | Endpunkt-IDs wie `chatCompletions` oder `responses` verweigern.                       |
| `gateway.http.requireUrlAllowlists`     | URL-Abrufeingaben der Gateway-HTTP-API                 | Auf `true` setzen, um URL-Zulassungslisten für URL-Abrufeingaben zu verlangen.        |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                           | Verlangen, dass exakte Node-Befehls-IDs wie `system.run` in der OpenClaw-Konfiguration verweigert werden. |

`gateway.nodes.denyCommands` ist eine exakte, zwischen Groß- und Kleinschreibung unterscheidende Verweigerungs-Obermengenregel.
Verwenden Sie sie, wenn die Richtlinie nachweisen muss, dass privilegierte Node-Befehle ausdrücklich
durch die OpenClaw-Konfiguration verweigert werden. Eine Bereitstellung, die absichtlich einen privilegierten
Node-Befehl zulässt, sollte nach einer Prüfung `policy.jsonc` aktualisieren, statt sich
allein auf `gateway.nodes.allowCommands` zu verlassen.

#### Agent-Arbeitsbereich

| Richtlinienfeld                  | Beobachteter Zustand                                                                 | Verwenden, wenn                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` und `agents.list[].sandbox.workspaceAccess` | Nur Sandbox-Arbeitsbereichszugriffswerte wie `none` oder `ro` zulässig sein sollen.       |
| `agents.workspace.denyTools`     | Globale und agentspezifische Konfiguration zur Werkzeugverweigerung                  | Mutationswerkzeuge (`exec`, `process`, `write`, `edit`, `apply_patch`) verweigert werden müssen. |

#### Sandbox-Sicherheitskonfiguration

| Richtlinienfeld                                      | Beobachteter Zustand                                    | Verwenden, wenn                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` und agentspezifischer Modus | Nur geprüfte Sandbox-Modi wie `all` oder `non-main` zulässig sein sollen. |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` und agentspezifisches Backend | Nur geprüfte Sandbox-Backends wie `docker` zulässig sein sollen. |
| `sandbox.containers.denyHostNetwork`                 | Netzwerkmodus der containerbasierten Sandbox/des Browsers | Der Host-Netzwerkmodus verweigert werden soll.                   |
| `sandbox.containers.denyContainerNamespaceJoin`      | Netzwerkmodus der containerbasierten Sandbox/des Browsers | Der Beitritt zum Netzwerk-Namensraum eines anderen Containers verweigert werden soll. |
| `sandbox.containers.requireReadOnlyMounts`           | Einbindungsmodus der containerbasierten Sandbox/des Browsers | Einbindungen schreibgeschützt sein müssen.                       |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Einbindungsziele der containerbasierten Sandbox/des Browsers | Einbindungen von Container-Runtime-Sockets verweigert werden sollen. |
| `sandbox.containers.denyUnconfinedProfiles`          | Konfiguration der Container-Sicherheitsprofile          | Uneingeschränkte Container-Sicherheitsprofile verweigert werden sollen. |
| `sandbox.browser.requireCdpSourceRange`              | CDP-Quellbereich des Sandbox-Browsers                    | Die Browser-CDP-Offenlegung einen Quellbereich deklarieren muss. |

Die Richtlinie behandelt ein fehlendes `sandbox.mode` als dessen impliziten Standardwert `off`, sodass
`sandbox.requireMode` eine neue oder nicht konfigurierte Sandbox als außerhalb einer
Zulassungsliste wie `["all"]` meldet.

#### Datenverarbeitung

| Richtlinienfeld                                    | Beobachteter Zustand                                                                | Verwenden, wenn                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                           | Auf `true` setzen, um `logging.redactSensitive: "off"` abzulehnen.      |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                   | Auf `true` setzen, um die Erfassung von Inhalten durch Telemetrie abzulehnen. |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                          | Auf `true` setzen, um den effektiven Sitzungswartungsmodus `enforce` zu verlangen. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` und `agents.*.memorySearch.experimental.sessionMemory` | Auf `true` setzen, um die Indizierung von Sitzungstranskripten im Speicher abzulehnen. |

#### Geheimnisse

| Richtlinienfeld                    | Beobachteter Zustand                                        | Verwenden, wenn                                                            |
| ---------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| `secrets.requireManagedProviders`  | SecretRefs der Konfiguration und Deklarationen unter `secrets.providers.*` | Auf `true` setzen, damit SecretRefs auf deklarierte Provider verweisen müssen. |
| `secrets.denySources`              | Quellen von Geheimnis-Providern und SecretRef-Quellen       | Quellen wie `exec`, `file` oder einen anderen konfigurierten Quellnamen verweigern. |
| `secrets.allowInsecureProviders`   | Unsichere Konfigurationsflags von Geheimnis-Providern       | Auf `false` setzen, um Provider abzulehnen, die eine unsichere Konfiguration aktivieren. |

#### Ausführungsgenehmigungen

Prüfungen der Ausführungsgenehmigungen lesen das Laufzeitartefakt `exec-approvals.json`:
standardmäßig `~/.openclaw/exec-approvals.json` oder
`$OPENCLAW_STATE_DIR/exec-approvals.json`, wenn `OPENCLAW_STATE_DIR` gesetzt ist.
Konfigurationsregeln unter `execApprovals.defaults.*` oder `execApprovals.agents.*`
erfordern lesbare Artefaktnachweise; ein fehlendes oder ungültiges Artefakt wird als
nicht beobachtbarer Nachweis gemeldet und nicht nach bestem Bemühen akzeptiert. Sobald es lesbar ist, übernehmen
ausgelassene Felder die Laufzeitstandardwerte: Ein fehlendes `defaults.security` ist `full`, und
eine fehlende Agent-Sicherheitseinstellung übernimmt diesen Standardwert. Der Nachweis umfasst `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, das optionale `argPattern`, die effektive
`autoAllowSkills`-Konfiguration und die Eintragsquelle — niemals Socket-Pfad/-Token,
`commandText`, `lastUsedCommand`, aufgelöste Pfade oder Zeitstempel.

| Richtlinienfeld                              | Beobachteter Zustand                                                                  | Verwenden, wenn                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                  | Pfad der aktiven Laufzeitdatei `exec-approvals.json`                                  | Auf `true` setzen, damit das Genehmigungsartefakt vorhanden und analysierbar sein muss.  |
| `execApprovals.defaults.allowSecurity`       | `defaults.security`, mit Standardwert `full`                                          | Nur genehmigte Standardsicherheitsmodi für Genehmigungen zulässig sein sollen.           |
| `execApprovals.agents.allowSecurity`         | `agents.*.security`, übernimmt Standardwerte                                          | Nur genehmigte effektive agentspezifische Sicherheitsmodi für Genehmigungen zulässig sein sollen. |
| `execApprovals.agents.allowAutoAllowSkills`  | `defaults.autoAllowSkills` und `agents.*.autoAllowSkills`, übernehmen Laufzeitstandardwerte | Auf `false` setzen, um strikte manuelle Zulassungslisten ohne implizite CLI-Genehmigung für Skills zu verlangen. |
| `execApprovals.agents.allowlist.expected`    | Zusammengefasste Einträge für Muster und optionales argPattern aus `agents.*.allowlist[]` | Verlangen, dass die Genehmigungs-Zulassungsliste dem geprüften Mustersatz entspricht.    |

Beispiel: Das Genehmigungsartefakt verlangen, freizügige Standardwerte verweigern und
nur die geprüfte Konfiguration der Ausführungsgenehmigungen für ausgewählte Agenten zulassen.

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
          // false bedeutet, dass Skill-CLIs in der geprüften Zulassungsliste aufgeführt sein müssen,
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

| Richtlinienfeld                 | Beobachteter Zustand                         | Verwenden, wenn                                                                                         |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Provider- und Modusmetadaten von `auth.profiles.*` | Metadatenschlüssel wie `provider` und `mode` für Authentifizierungsprofile in der Konfiguration erforderlich sein sollen. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Nur unterstützte Modi für Authentifizierungsprofile wie `api_key`, `aws-sdk`, `oauth` oder `token` zugelassen werden sollen. |

#### Werkzeugmetadaten

| Richtlinienfeld         | Beobachteter Zustand                    | Verwenden, wenn                                                                                          |
| ----------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Verwaltete Deklarationen in `TOOLS.md`  | Verwaltete Werkzeuge Metadatenschlüssel wie `risk`, `sensitivity` oder `owner` deklarieren müssen.       |

#### Werkzeughaltung

| Richtlinienfeld                 | Beobachteter Zustand                                        | Verwenden, wenn                                                                                                   |
| ------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` und `agents.list[].tools.profile`           | Nur Werkzeugprofil-IDs wie `minimal`, `messaging` oder `coding` zugelassen werden sollen.                        |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` und agentenspezifische Überschreibungen von `tools.fs` | Auf `true` setzen, um eine auf den Arbeitsbereich beschränkte Haltung der Dateisystemwerkzeuge zu verlangen. |
| `tools.exec.allowSecurity`      | `tools.exec.security` und agentenspezifische Ausführungssicherheit | Nur Sicherheitsmodi für die Ausführung wie `deny` oder `allowlist` zugelassen werden sollen.               |
| `tools.exec.requireAsk`         | `tools.exec.ask` und agentenspezifischer Bestätigungsmodus für die Ausführung | Eine Bestätigungshaltung wie `always` erforderlich sein soll.                                            |
| `tools.exec.allowHosts`         | `tools.exec.host` und agentenspezifisches Host-Routing für die Ausführung | Nur Host-Routing-Modi für die Ausführung wie `sandbox` zugelassen werden sollen.                           |
| `tools.elevated.allow`          | `tools.elevated.enabled` und agentenspezifische privilegierte Haltung | Auf `false` setzen, damit der privilegierte Werkzeugmodus deaktiviert bleiben muss.                        |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` und agentenspezifisches `tools.alsoAllow` | Exakte `alsoAllow`-Einträge erforderlich sein und fehlende oder unerwartete zusätzliche Werkzeugfreigaben gemeldet werden sollen. |
| `tools.denyTools`               | `tools.deny` und `agents.list[].tools.deny`                 | Konfigurierte Werkzeug-Sperrlisten Werkzeug-IDs oder Gruppen wie `group:runtime` und `group:fs` enthalten müssen. |

## Prüfungen ausführen

Führen Sie beim Erstellen ausschließlich Richtlinienprüfungen aus:

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
Laufzeitzustand, Nachweise, Anmeldedaten oder Geheimnisse werden nicht untersucht. Dabei werden dieselben
Regelmetadaten verwendet, die bereichsbezogene Überlagerungen steuern: Zulassungslisten müssen gleich bleiben
oder enger werden, Sperrlisten müssen gleich bleiben oder weiter werden, erforderliche boolesche Werte müssen
ihren Wert beibehalten, geordnete Zeichenfolgen dürfen sich nur zum strengeren Ende der
konfigurierten Reihenfolge bewegen und exakte Listen müssen übereinstimmen. Die Baseline kann eine
von einer Organisation erstellte Richtlinie sein; die geprüfte Richtlinie darf strengere Werte oder
zusätzliche Regeln hinzufügen. Eine geprüfte Regel auf oberster Ebene kann eine bereichsbezogene Baseline-Regel
erfüllen, wenn sie gleich restriktiv oder restriktiver ist. Bereichsnamen müssen zwischen den
Dateien nicht übereinstimmen; der Vergleich wird anhand des Selektors (`agentIds`/`channelIds`) und des Felds zugeordnet.

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

Die Ausgabe eines erfolgreichen `policy check --json` enthält stabile Hashes, die ein Betreiber oder
eine Aufsicht aufzeichnen kann:

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

| Einstellung               | Zweck                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| `enabled`                 | Richtlinienprüfungen aktivieren, noch bevor `policy.jsonc` vorhanden ist. |
| `workspaceRepairs`        | `doctor --fix` erlauben, richtlinienverwaltete Arbeitsbereichseinstellungen zu bearbeiten. |
| `expectedHash`            | Optionale Hash-Sperre für das genehmigte Richtlinienartefakt.            |
| `expectedAttestationHash` | Optionale Hash-Sperre für die zuletzt akzeptierte erfolgreiche Richtlinienprüfung. |
| `path`                    | Relativ zum Arbeitsbereich angegebener Speicherort des Richtlinienartefakts. |

Setzen Sie `plugins.entries.policy.config.enabled` auf `false`, um Richtlinienprüfungen
für einen Arbeitsbereich zu deaktivieren, während das Plugin installiert bleibt.

## Richtlinienzustand akzeptieren

Beispielausgabe im JSON-Format:

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
zeichnet den beobachteten OpenClaw-Zustand auf, den die Prüfungen verwendet haben, und
`workspace.hash` identifiziert diese Nachweisnutzlast. `findingsHash` identifiziert
den exakten Satz von Feststellungen. `checkedAt` zeichnet auf, wann die Prüfung ausgeführt wurde.
`attestationHash` identifiziert die stabile Aussage (Richtlinienhash, Nachweishash,
Feststellungshash und erfolgreicher/fehlerhafter Zustand) und schließt `checkedAt` bewusst aus,
sodass derselbe Richtlinienzustand stets denselben Attestierungshash erzeugt. Zusammen
bilden diese vier Werte das Audit-Tupel für eine Richtlinienprüfung.

Wenn ein Gateway oder eine Aufsicht Richtlinien verwendet, um eine Laufzeitaktion zu blockieren,
zu genehmigen oder mit Anmerkungen zu versehen, sollte der Attestierungshash der letzten
erfolgreichen Prüfung aufgezeichnet werden. `checkedAt` verbleibt für Auditprotokolle in der JSON-Ausgabe,
ist jedoch nicht Teil des stabilen Hashes.

Lebenszyklus für die Akzeptanz eines Richtlinienzustands:

1. Erstellen oder prüfen Sie `policy.jsonc`.
2. Führen Sie `openclaw policy check --json` aus.
3. Zeichnen Sie bei erfolgreicher Prüfung `attestation.policy.hash` als `expectedHash` auf.
4. Zeichnen Sie `attestation.attestationHash` als `expectedAttestationHash` auf.
5. Führen Sie `openclaw doctor --lint` erneut in CI- oder Freigabeprüfungen aus.

Wenn Richtlinienregeln absichtlich geändert werden, aktualisieren Sie beide akzeptierten Hashes anhand einer
sauberen Prüfung. Wenn sich nur Workspace-Einstellungen ändern (die Richtlinie bleibt unverändert),
ändert sich normalerweise nur `expectedAttestationHash`.

Durch Aktivieren oder Aktualisieren von `agents.workspace`-Regeln werden `agentWorkspace`-Nachweise
zum Workspace-Hash und zum Attestierungs-Hash hinzugefügt. Prüfen Sie die neuen Nachweise und
aktualisieren Sie nach der Aktivierung die akzeptierten Attestierungs-Hashes. Durch Aktivieren oder Aktualisieren
von Regeln für die Tool-Sicherheitskonfiguration werden auf dieselbe Weise `toolPosture`-Nachweise hinzugefügt.

`openclaw policy watch` führt die Prüfung erneut aus und meldet, wenn die aktuellen Nachweise nicht
mehr mit `expectedAttestationHash` übereinstimmen:

```bash
openclaw policy watch --json
```

Verwenden Sie `--once` in CI oder Skripten, die eine einmalige Abweichungsprüfung benötigen. Ohne
`--once` erfolgt die Abfrage standardmäßig alle zwei Sekunden. Verwenden Sie `--interval-ms`, um
das Intervall zu ändern.

## Befunde

| Prüf-ID                                                  | Befund                                                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Die Richtlinie ist aktiviert, aber `policy.jsonc` fehlt.                                           |
| `policy/policy-jsonc-invalid`                            | Die Richtlinie kann nicht geparst werden oder enthält fehlerhafte Regeleinträge.                    |
| `policy/policy-hash-mismatch`                            | Die Richtlinie stimmt nicht mit dem konfigurierten `expectedHash` überein.                           |
| `policy/attestation-hash-mismatch`                       | Die aktuellen Richtliniennachweise stimmen nicht mehr mit der akzeptierten Attestierung überein.    |
| `policy/policy-conformance-invalid`                      | Eine Basis- oder geprüfte Richtliniendatei enthält eine ungültige Vergleichssyntax.                 |
| `policy/policy-conformance-missing`                      | In einer geprüften Richtliniendatei fehlt eine von der Basisrichtliniendatei verlangte Regel.       |
| `policy/policy-conformance-weaker`                       | Eine geprüfte Richtliniendatei enthält einen schwächeren Wert als die Basisrichtliniendatei.        |
| `policy/channels-denied-provider`                        | Ein aktivierter Kanal entspricht einer Kanal-Ablehnungsregel.                                      |
| `policy/mcp-denied-server`                               | Ein konfigurierter MCP-Server wird von der Richtlinie abgelehnt.                                   |
| `policy/mcp-unapproved-server`                           | Ein konfigurierter MCP-Server befindet sich außerhalb der Zulassungsliste.                          |
| `policy/models-denied-provider`                          | Ein konfigurierter Modell-Provider oder eine Modellreferenz verwendet einen abgelehnten Provider.   |
| `policy/models-unapproved-provider`                      | Ein konfigurierter Modell-Provider oder eine Modellreferenz befindet sich außerhalb der Zulassungsliste. |
| `policy/network-private-access-enabled`                  | Eine SSRF-Ausnahmeregel für private Netzwerke ist aktiviert, obwohl die Richtlinie sie ablehnt.      |
| `policy/ingress-dm-policy-unapproved`                    | Eine Direktnachrichtenrichtlinie eines Kanals befindet sich außerhalb der Richtlinien-Zulassungsliste. |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` entspricht nicht dem von der Richtlinie verlangten Isolationsbereich für Direktnachrichten. |
| `policy/ingress-open-groups-denied`                      | Eine Kanalgruppenrichtlinie ist `open`, obwohl die Richtlinie offenen Gruppeneingang ablehnt.       |
| `policy/ingress-group-mention-required`                  | Ein Kanal- oder Gruppeneintrag deaktiviert Erwähnungsschranken, obwohl die Richtlinie sie verlangt. |
| `policy/gateway-non-loopback-bind`                       | Die Gateway-Bindungskonfiguration erlaubt eine Offenlegung außerhalb von local loopback, obwohl die Richtlinie sie ablehnt. |
| `policy/gateway-auth-disabled`                           | Die Gateway-Authentifizierung ist deaktiviert, obwohl die Richtlinie sie verlangt.                  |
| `policy/gateway-rate-limit-missing`                      | Die Konfiguration der Gateway-Authentifizierungsratenbegrenzung ist nicht explizit, obwohl die Richtlinie dies verlangt. |
| `policy/gateway-control-ui-insecure`                     | Schalter für eine unsichere Offenlegung der Gateway-Steuerungsoberfläche sind aktiviert.            |
| `policy/gateway-tailscale-funnel`                        | Die Offenlegung über Gateway Tailscale Funnel ist aktiviert, obwohl die Richtlinie sie ablehnt.     |
| `policy/gateway-remote-enabled`                          | Der Gateway-Remote-Modus ist aktiv, obwohl die Richtlinie ihn ablehnt.                              |
| `policy/gateway-http-endpoint-enabled`                   | Ein Gateway-HTTP-API-Endpunkt ist aktiviert, obwohl die Richtlinie ihn ablehnt.                     |
| `policy/gateway-http-url-fetch-unrestricted`             | Für die URL-Abrufeingabe über Gateway HTTP fehlt eine erforderliche URL-Zulassungsliste.             |
| `policy/gateway-node-command-denied`                     | Ein von der Richtlinie abgelehnter Node-Befehl wird von der OpenClaw-Konfiguration nicht abgelehnt. |
| `policy/agents-workspace-access-denied`                  | Der Agent-Sandbox-Modus oder Workspace-Zugriff befindet sich außerhalb der Richtlinien-Zulassungsliste. |
| `policy/agents-tool-not-denied`                          | Eine Agenten- oder Standardkonfiguration lehnt ein von der Richtlinie vorgeschriebenes Tool nicht ab. |
| `policy/tools-profile-unapproved`                        | Ein konfiguriertes globales oder agentenspezifisches Tool-Profil befindet sich außerhalb der Zulassungsliste. |
| `policy/tools-fs-workspace-only-required`                | Dateisystem-Tools sind nicht mit einer ausschließlich auf den Workspace beschränkten Pfadkonfiguration eingerichtet. |
| `policy/tools-exec-security-unapproved`                  | Der Exec-Sicherheitsmodus befindet sich außerhalb der Richtlinien-Zulassungsliste.                   |
| `policy/tools-exec-ask-unapproved`                       | Der Exec-Abfragemodus befindet sich außerhalb der Richtlinien-Zulassungsliste.                      |
| `policy/tools-exec-host-unapproved`                      | Das Exec-Host-Routing befindet sich außerhalb der Richtlinien-Zulassungsliste.                      |
| `policy/tools-elevated-enabled`                          | Der Tool-Modus mit erhöhten Berechtigungen ist aktiviert, obwohl die Richtlinie ihn ablehnt.        |
| `policy/tools-also-allow-missing`                        | In einer konfigurierten `alsoAllow`-Liste fehlt ein von der Richtlinie verlangter Eintrag.           |
| `policy/tools-also-allow-unexpected`                     | Eine konfigurierte `alsoAllow`-Liste enthält einen von der Richtlinie nicht erwarteten Eintrag.     |
| `policy/tools-required-deny-missing`                     | Eine globale oder agentenspezifische Tool-Ablehnungsliste enthält ein zwingend abzulehnendes Tool nicht. |
| `policy/sandbox-mode-unapproved`                         | Der Sandbox-Modus befindet sich außerhalb der Richtlinien-Zulassungsliste.                           |
| `policy/sandbox-backend-unapproved`                      | Das Sandbox-Backend befindet sich außerhalb der Richtlinien-Zulassungsliste.                         |
| `policy/sandbox-container-posture-unobservable`          | Eine Container-Konfigurationsregel ist für ein Backend aktiviert, das sie nicht beobachten kann.    |
| `policy/sandbox-container-host-network-denied`           | Eine containerbasierte Sandbox oder ein containerbasierter Browser verwendet den Host-Netzwerkmodus. |
| `policy/sandbox-container-namespace-join-denied`         | Eine containerbasierte Sandbox oder ein containerbasierter Browser tritt dem Namespace eines anderen Containers bei. |
| `policy/sandbox-container-mount-mode-required`           | Eine Einbindung einer containerbasierten Sandbox oder eines containerbasierten Browsers ist nicht schreibgeschützt. |
| `policy/sandbox-container-runtime-socket-mount`          | Eine Einbindung einer containerbasierten Sandbox oder eines containerbasierten Browsers legt den Socket der Container-Laufzeit offen. |
| `policy/sandbox-container-unconfined-profile`            | Das Container-Sandbox-Profil ist unbeschränkt, obwohl die Richtlinie dies ablehnt.                  |
| `policy/sandbox-browser-cdp-source-range-missing`        | Der CDP-Quellbereich des Sandbox-Browsers fehlt, obwohl die Richtlinie einen verlangt.              |
| `policy/data-handling-redaction-disabled`                | Die Schwärzung vertraulicher Protokolldaten ist deaktiviert, obwohl die Richtlinie sie verlangt.    |
| `policy/data-handling-telemetry-content-capture`         | Die Erfassung von Telemetrieinhalten ist aktiviert, obwohl die Richtlinie sie ablehnt.              |
| `policy/data-handling-session-retention-not-enforced`    | Die Wartung der Sitzungsaufbewahrung wird nicht durchgesetzt, obwohl die Richtlinie dies verlangt.  |
| `policy/data-handling-session-transcript-memory-enabled` | Die Speicherindizierung von Sitzungstranskripten ist aktiviert, obwohl die Richtlinie sie ablehnt.  |
| `policy/secrets-unmanaged-provider`                      | Eine SecretRef in der Konfiguration verweist auf einen Provider, der nicht unter `secrets.providers` deklariert ist. |
| `policy/secrets-denied-provider-source`                  | Ein Secret-Provider oder eine SecretRef in der Konfiguration verwendet eine von der Richtlinie abgelehnte Quelle. |
| `policy/secrets-insecure-provider`                       | Ein Secret-Provider aktiviert eine unsichere Konfiguration, obwohl die Richtlinie sie ablehnt.      |
| `policy/auth-profile-invalid-metadata`                   | In einem Authentifizierungsprofil der Konfiguration fehlen gültige Provider- oder Modusmetadaten.   |
| `policy/auth-profile-unapproved-mode`                    | Der Modus eines Authentifizierungsprofils der Konfiguration befindet sich außerhalb der Richtlinien-Zulassungsliste. |
| `policy/exec-approvals-missing`                          | Die Richtlinie verlangt `exec-approvals.json`, aber das Artefakt fehlt.                             |
| `policy/exec-approvals-invalid`                          | Das konfigurierte Artefakt für Exec-Genehmigungen kann nicht geparst werden.                        |
| `policy/exec-approvals-default-security-unapproved`      | Die Standardwerte für Exec-Genehmigungen verwenden einen Sicherheitsmodus außerhalb der Richtlinien-Zulassungsliste. |
| `policy/exec-approvals-agent-security-unapproved`        | Der effektive agentenspezifische Sicherheitsmodus für Exec-Genehmigungen befindet sich außerhalb der Zulassungsliste. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Ein Agent für Exec-Genehmigungen lässt Skills-CLIs implizit automatisch zu, obwohl die Richtlinie dies ablehnt. |
| `policy/exec-approvals-allowlist-missing`                | In der Genehmigungs-Zulassungsliste fehlt ein von der Richtlinie verlangtes Muster.                 |
| `policy/exec-approvals-allowlist-unexpected`             | Die Genehmigungs-Zulassungsliste enthält ein von der Richtlinie nicht erwartetes Muster.            |
| `policy/tools-missing-risk-level`                        | In einer verwalteten Tool-Deklaration fehlen Risikometadaten.                                      |
| `policy/tools-unknown-risk-level`                        | Eine verwaltete Tool-Deklaration verwendet einen unbekannten Risikowert.                            |
| `policy/tools-missing-sensitivity-token`                 | In einer verwalteten Tool-Deklaration fehlen Vertraulichkeitsmetadaten.                             |
| `policy/tools-missing-owner`                             | In einer verwalteten Tool-Deklaration fehlen Eigentümermetadaten.                                  |
| `policy/tools-unknown-sensitivity-token`                 | Eine verwaltete Tool-Deklaration verwendet einen unbekannten Vertraulichkeitswert.                  |

Ein Befund kann sowohl `target` (das beobachtete Workspace-Objekt, das
nicht konform ist) als auch `requirement` (die verfasste Regel, die den Befund ausgelöst hat)
enthalten. Beide sind derzeit `oc://`-Adresszeichenfolgen, die Feldnamen beschreiben jedoch die
Rolle in der Richtlinie und nicht das Adressformat.

Beispielbefunde:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Kanal 'telegram' verwendet den abgelehnten Provider 'telegram'.",
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
  "message": "Das Tool 'deploy' in TOOLS.md hat keine explizite Risikoklassifizierung.",
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
  "message": "MCP server 'remote' is not in the policy allowlist.",
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
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
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
  "message": "Network setting 'browser-private-network' allows private-network access.",
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
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
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
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
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
`workspaceRepairs` ausdrücklich aktiviert ist. Andernfalls melden die Prüfungen, welche
Reparaturen sie durchführen würden, und lassen die Einstellungen unverändert.

In dieser Version kann die Reparatur durch `channels.denyRules` untersagte Kanäle deaktivieren
und die unten aufgeführten automatischen Einschränkungsreparaturen anwenden. Aktivieren Sie
`workspaceRepairs` erst, nachdem die Richtliniendatei überprüft wurde, da eine gültige Regel
die Arbeitsbereichskonfiguration ändern kann:

- `tools.elevated.enabled=false` festlegen, wenn eine globale Richtlinie privilegierte Werkzeuge untersagt
- fehlende, zwingend zu sperrende Werkzeug-IDs zu `tools.deny` oder
  `agents.list[].tools.deny` hinzufügen, wenn die Richtlinie die Sperrung dieser Werkzeuge vorschreibt
- unsichere Schalter unter `gateway.controlUi.*` auf `false` setzen
- `gateway.mode=local` festlegen, wenn die Richtlinie den entfernten Gateway-Modus untersagt
- gemeldete Pfade unter `gateway.http.endpoints.*.enabled` auf `false` setzen, wenn die Richtlinie
  HTTP-API-Endpunkte des Gateways untersagt
- gemeldete `groupPolicy`-Pfade für den Kanaleingang auf `allowlist` setzen, wenn die Richtlinie
  offenen Gruppeneingang untersagt
- gemeldete `requireMention`-Pfade für den Kanaleingang auf `true` setzen, wenn die Richtlinie
  Erwähnungen in Gruppen vorschreibt
- `logging.redactSensitive=tools` festlegen, wenn die Richtlinie die Schwärzung sensibler
  Protokolldaten vorschreibt
- `diagnostics.otel.captureContent=false` oder bei Telemetrie-Erfassungseinstellungen
  in Objektform `diagnostics.otel.captureContent.enabled=false` festlegen, wenn die Richtlinie
  die Erfassung von Telemetrieinhalten untersagt

Bereichsspezifische Reparaturen für privilegierte Werkzeuge werden nur erkannt, aber nicht angewendet.
Bereichsspezifische Reparaturen für die Datenverarbeitung werden ebenfalls übersprungen, wenn der
Befund eine gemeinsam genutzte Protokollierungs- oder Telemetriekonfiguration meldet, da eine Änderung
der gemeinsamen Einstellung mehr als das bereichsspezifische Richtlinienziel betreffen würde.

Bereichsspezifische Reparaturen für zwingend erforderliche Sperren werden übersprungen, wenn der Befund
ein geerbtes `tools.deny` auf Stammebene meldet, da das Hinzufügen des erforderlichen Werkzeugs zur
Stammkonfiguration mehr als das bereichsspezifische Richtlinienziel betreffen würde. Agent-lokale
Reparaturen für zwingend erforderliche Sperren können den gemeldeten Pfad
`agents.list[].tools.deny` aktualisieren.

Bereichsspezifische Reparaturen des Kanaleingangs werden übersprungen, wenn der Befund geerbte
`channels.defaults.*` meldet, da eine Änderung des gemeinsam genutzten Kanalstandards mehr als das
bereichsspezifische Richtlinienziel betreffen würde. Befunde zur URL-Abruf-Zulassungsliste für
Gateway-HTTP müssen weiterhin manuell behoben werden, da die automatische Reparatur nicht die
richtigen Zulassungslistenwerte für Endpunkt-URLs auswählen kann.

Befunde zur Gateway-Bindung und zu Node-Befehlen müssen weiterhin überprüft werden. Wenn
`policy/gateway-non-loopback-bind` oder `policy/gateway-node-command-denied`
einem Konfigurationspfad zugeordnet werden kann, meldet `doctor --fix` die vorgeschlagene
Änderung an `gateway.bind` oder `gateway.nodes.denyCommands` als übersprungene
Vorschauhilfe. Die Änderung wird nicht angewendet, und der Befund gilt erst dann als
repariert, wenn ein Betreiber die Konfiguration oder Richtlinie überprüft und aktualisiert.

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

## Exitcodes

| Befehl           | `0`                                                            | `1`                                                                         | `2`                              |
| ---------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------- |
| `policy check`   | Keine Befunde ab dem Schwellenwert.                            | Mindestens ein Befund hat den Schwellenwert erreicht.                       | Argument- oder Laufzeitfehler.   |
| `policy compare` | Die Richtliniendatei ist mindestens so streng wie die Basis.   | Die Richtliniendatei ist ungültig, fehlt oder ist schwächer als die Basisregeln. | Argument- oder Laufzeitfehler. |
| `policy watch`   | Keine Befunde und der akzeptierte Hash ist aktuell.            | Es liegen Befunde vor oder die akzeptierte Bestätigung ist veraltet.        | Argument- oder Laufzeitfehler.   |

## Verwandte Themen

- [Lint-Modus von Doctor](/de/cli/doctor#lint-mode)
- [Pfad-CLI](/de/cli/path)
