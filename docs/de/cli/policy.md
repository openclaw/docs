---
read_when:
    - Sie möchten die OpenClaw-Einstellungen anhand einer erstellten policy.jsonc überprüfen.
    - Sie möchten Richtlinienbefunde in der Doctor-Prüfung sehen
    - Sie benötigen einen Hash der Richtlinienbestätigung als Auditnachweis
summary: CLI-Referenz für `openclaw policy`-Konformitätsprüfungen
title: Richtlinie
x-i18n:
    generated_at: "2026-07-24T03:46:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63e4faeab8dd6535e3d517439d3f58cdc167b6b7fade808a6482742ec9b5acf1
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` wird vom gebündelten Policy-Plugin bereitgestellt. Es handelt sich um eine unternehmensweite
Konformitätsschicht über vorhandenen OpenClaw-Einstellungen, nicht um ein zweites
Konfigurationssystem. Sie verfassen Anforderungen in `policy.jsonc`; OpenClaw betrachtet den aktiven
Workspace als Nachweis; Policy meldet Abweichungen über `doctor --lint`. Policy
erzwingt keine Tool-Aufrufe und schreibt das Laufzeitverhalten nicht bei der Anfrageverarbeitung um. Außerdem
attestiert es keine agentenspezifischen Anmeldedatenspeicher wie `auth-profiles.json`.

Policy prüft konfigurierte Kanäle, MCP-Server, Modell-Provider, die SSRF-
Sicherheitslage des Netzwerks, Eingangs-/Kanalzugriff, Gateway-Exposition und die Befehlslage von Nodes,
verfasste Nachrichten-Routing-Prüfungen,
den Workspace-Zugriff von Agenten, die Sandbox-Sicherheitslage, die Datenverarbeitungslage, die Lage von Secret-
Providern/Authentifizierungsprofilen und Metadaten verwalteter Tools (`TOOLS.md`). Verwenden Sie es,
wenn ein Workspace eine dauerhafte, überprüfbare Festlegung benötigt, etwa „Telegram darf
nicht aktiviert sein“ oder „verwaltete Tools müssen Risiko- und Eigentümermetadaten deklarieren“. Wenn
Sie nur lokales Verhalten ohne Attestierung oder Abweichungserkennung benötigen, reicht die normale
Konfiguration aus.

## Schnellstart

```bash
openclaw plugins enable policy
```

Das Plugin bleibt auch dann aktiviert, wenn `policy.jsonc` fehlt, sodass doctor
das fehlende Artefakt melden kann, statt Prüfungen stillschweigend zu überspringen.

Verfassen Sie `policy.jsonc` manuell; es wird nicht aus den aktuellen Einstellungen generiert. Jeder
Abschnitt auf oberster Ebene ist ein Regel-Namespace: Eine Prüfung wird nur ausgeführt, wenn darunter eine konkrete Regel
vorhanden ist (nicht unterstützte Abschnitte oder Schlüssel schlagen mit
`policy/policy-jsonc-invalid` fehl, statt stillschweigend ignoriert zu werden). Minimales
Beispiel, das jeden unterstützten Abschnitt abdeckt:

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
  "routing": {
    "requireBindings": true,
    "requireConfiguredChannels": true,
    "probes": [
      {
        "id": "family-dm",
        "route": {
          "channel": "imessage",
          "peer": { "kind": "direct", "id": "+15555550123" },
        },
        "expect": {
          "agentId": "family",
          "matchedBy": ["binding.peer"],
        },
      },
    ],
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

Abschnittsübergreifende Hinweise, die aus den nachstehenden Regeltabellen nicht offensichtlich hervorgehen:

- Wenn Sie `gateway.bind` weglassen und gleichzeitig Nicht-Loopback-Bindungen verweigern, akzeptieren Sie
  den Laufzeitstandard; legen Sie `gateway.bind: "loopback"` für strikte Konformität fest.
- Legen Sie für einen schreibgeschützten Agenten den Sandbox-Wert `mode` bei den
  zutreffenden Standardwerten/dem zutreffenden Agenten auf `all` oder `non-main` und `workspaceAccess` auf `none` oder `ro` fest. Ein fehlender oder
  auf `off` gesetzter Sandbox-Modus erfüllt keine Richtlinie für schreibgeschützten Zugriff.
- `agents.workspace.denyTools` akzeptiert `exec`, `process`, `write`, `edit`,
  `apply_patch`. Die Tool-Verweigerungsgruppen der Konfiguration `group:fs` (Dateiveränderung) und
  `group:runtime` (Shell/Prozess) erfüllen die entsprechende Sicherheitslage.
- Prüfungen von Ausführungsgenehmigungen lesen das aktive Artefakt `exec-approvals.json` nur, wenn
  eine Regel `execApprovals` vorhanden ist; ein fehlendes oder ungültiges Artefakt ist
  nicht beobachtbarer Nachweis und kein synthetisch bestandener Test.
- Nachweise zu Secrets und Authentifizierungsprofilen zeichnen nur die Provider-/Quellenlage und
  SecretRef-Metadaten auf, niemals Rohwerte. Policy liest oder attestiert
  keine agentenspezifischen Anmeldedatenspeicher wie `auth-profiles.json`.
- Nachweise zur Datenverarbeitung betreffen ausschließlich die Konfigurationslage (Schwärzungsmodus,
  Umschalter für Telemetrieerfassung, Sitzungswartungsmodus, Einstellung zur Transkriptindizierung).
  Sie untersuchen keine Protokolle, Telemetrieexporte, Transkripte oder
  Speicherdateien, und ein fehlerfreies Ergebnis beweist nicht, dass darin keine personenbezogenen Daten oder
  Secrets vorhanden sind.
- Routing-Prüfungen verwenden den Laufzeit-Bindungsresolver von OpenClaw erneut. Routing-Nachweise
  zeichnen nur die Prüfungs-ID, den aufgelösten Agenten, die Übereinstimmungsart und geschwärzte Bindungsmetadaten
  auf. Sie zeichnen niemals Peer-, Konto-, Guild-, Team- oder Rollenkennungen auf.
  Das Hinzufügen eines Routing-Abschnitts ändert absichtlich die Policy- und Attestierungshashes;
  Richtlinien ohne Routing behalten ihre vorhandene Nachweisstruktur.

### Referenz der Policy-Regeln

Jede nachstehende Regel ist optional; eine Prüfung wird nur ausgeführt, wenn die Regel vorhanden ist. Der
beobachtete Zustand besteht aus der vorhandenen OpenClaw-Konfiguration oder den Workspace-Metadaten.

#### Bereichsbezogene Overlays

Verwenden Sie `scopes.<scopeName>`, wenn bestimmte Agenten oder Kanäle eine strengere Policy
als die Baseline auf oberster Ebene benötigen. Der Bereichsname ist nur eine Bezeichnung; der Abgleich verwendet den
Selektor innerhalb des Bereichs. Overlays sind additiv: Die globale Regel wird weiterhin ausgeführt,
und die bereichsbezogene Regel kann einen eigenen Befund für denselben Nachweis hinzufügen.

| Selektor     | Unterstützte Abschnitte                                                             | Verwendung                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Ein oder mehrere Laufzeitagenten benötigen strengere Regeln.   |
| `channelIds` | `ingress.channels`                                                             | Ein oder mehrere Kanäle benötigen strengere Eingangsregeln. |

Wenn ein Eintrag `agentIds` nicht in `agents.entries.*` vorhanden ist, wertet OpenClaw
die bereichsbezogene Regel anhand der geerbten globalen/standardmäßigen Sicherheitslage für diese
Laufzeitagenten-ID aus, statt sie zu überspringen.

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

Derselbe Agent kann in mehreren Bereichen vorkommen, wenn jeder Bereich ein anderes
Feld verwaltet, wie oben dargestellt. Ein wiederholtes bereichsbezogenes Feld für denselben Agenten muss gleich
oder stärker einschränkend sein; eine schwächere doppelte Festlegung wird abgelehnt (Zulassungslisten sind
Teilmengen, Verweigerungslisten sind Obermengen, erforderliche boolesche Werte sind festgelegt).

Regeln zur Container-Sicherheitslage (`sandbox.containers.*`) werden nur anhand der
Nachweise geprüft, die das Sandbox-Backend des übereinstimmenden Agenten offenlegen kann. Wenn ein Backend
eine dafür aktivierte Regel nicht beobachten kann, meldet Policy
`policy/sandbox-container-posture-unobservable`, statt die Prüfung als bestanden zu werten; beschränken Sie
Container-Regeln auf die Agentengruppen, die ein Backend verwenden, das sie offenlegen kann.

`ingress.session.requireDmScope` auf oberster Ebene bleibt global; `session.dmScope` ist
kein einem Kanal zuordenbarer Nachweis und kann daher nicht nach `channelIds` abgegrenzt werden.

Jeder in `policy.jsonc` vorhandene Bereich muss gültig und durchsetzbar sein.

#### Kanäle

| Policy-Feld                         | Beobachteter Zustand                          | Verwendung                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | Provider und Aktivierungsstatus von `channels.*` | Konfigurierte Kanäle eines Providers wie `telegram` verweigern. |
| `channels.denyRules[].reason`        | Kontext der Befundmeldung und des Reparaturhinweises | Erläutern, warum der Provider verweigert wird.                          |

#### MCP-Server

| Policy-Feld        | Beobachteter Zustand      | Verwendung                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | IDs von `mcp.servers.*` | Verlangen, dass jeder konfigurierte MCP-Server in einer Zulassungsliste enthalten ist. |
| `mcp.servers.deny`  | IDs von `mcp.servers.*` | Bestimmte konfigurierte MCP-Server-IDs verweigern.                   |

#### Modell-Provider

| Policy-Feld             | Beobachteter Zustand                                   | Verwendung                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | IDs von `models.providers.*` und ausgewählte Modellreferenzen | Verlangen, dass konfigurierte Provider und ausgewählte Modellreferenzen genehmigte Provider verwenden. |
| `models.providers.deny`  | IDs von `models.providers.*` und ausgewählte Modellreferenzen | Konfigurierte Provider und ausgewählte Modellreferenzen anhand der Provider-ID verweigern.               |

#### Netzwerk

| Richtlinienfeld                   | Beobachteter Zustand                      | Verwenden, wenn                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | SSRF-Ausnahmemechanismen für private Netzwerke | Auf `false` setzen, damit der Zugriff auf private Netzwerke deaktiviert bleiben muss. |

#### Nachrichtenweiterleitung

| Richtlinienfeld                        | Beobachteter Zustand                                      | Verwenden, wenn                                                               |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `routing.requireBindings`           | Kanalroutenbindungen, ausgenommen ACP-Bindungen      | Mindestens eine Bindung für die Nachrichtenweiterleitung erforderlich sein soll.                          |
| `routing.requireConfiguredChannels` | Kanal-IDs der Bindungen und konfigurierte `channels.*`-IDs | Veraltete oder falsch geschriebene Kanal-IDs in Bindungen erkannt werden sollen.                        |
| `routing.probes[].route`            | Der öffentliche OpenClaw-Routen-Resolver                  | Eine repräsentative eingehende Route beschrieben werden soll, ohne eine Nachricht zu senden.     |
| `routing.probes[].expect.agentId`   | Aufgelöste Agenten-ID                                   | Die Route den überprüften Agenten erreichen muss.                         |
| `routing.probes[].expect.matchedBy` | Übereinstimmungsart des Resolvers                                 | Eine überprüfte Bindungsspezifität für Peer, Konto, Kanal oder eine andere Art erforderlich sein soll. |

Prüf-IDs müssen eindeutig sein. Eine Route unterstützt `channel`, optional `accountId`,
`peer`, `parentPeer`, `guildId`, `teamId` und `memberRoleIds`. Peer-Arten sind
`direct`, `group` und `channel`. `matchedBy` kann eine oder mehrere
Laufzeit-Übereinstimmungsarten enthalten, darunter `binding.peer`, `binding.account`, `binding.channel`
oder `default`.

Weiterleitungsprüfungen sind ausschließlich Konformitätsprüfungen. Sie ändern weder den Startvorgang
noch die Nachrichtenzustellung, die Bindungspriorität oder das Fallback-Verhalten. Befunde erfordern
eine Überprüfung durch den Betreiber, da die automatische Änderung einer Bindung
private Nachrichten umleiten könnte.

#### Ingress- und Kanalzugriff

| Richtlinienfeld                              | Beobachteter Zustand                                                 | Verwenden, wenn                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | Ein überprüfter Isolationsbereich für Direktnachrichten erforderlich sein soll.                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` und veraltete Richtlinienfelder für Kanal-Direktnachrichten      | Nur überprüfte Kanalrichtlinien für Direktnachrichten zulässig sein sollen.               |
| `ingress.channels.denyOpenGroups`         | Ingress-Richtlinie für Kanal, Konto und Gruppe                     | Offener Gruppen-Ingress für konfigurierte Kanäle und Konten verweigert werden soll.      |
| `ingress.channels.requireMentionInGroups` | Mention-Gate-Konfiguration für Kanal, Konto, Gruppe, Guild und verschachtelte Erwähnungen | Mention-Gates erforderlich sein sollen, wenn der Gruppen-Ingress offen ist oder ein Mention-Gate verwendet. |

#### Gateway

| Richtlinienfeld                            | Beobachteter Zustand                                 | Verwenden, wenn                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | Auf `false` setzen, damit die Gateway-Bindung an Loopback erforderlich ist.                                  |
| `gateway.exposure.allowTailscaleFunnel` | Gateway-Sicherheitsstatus für Tailscale Serve/Funnel         | Auf `false` setzen, um eine Exposition über Tailscale Funnel zu verweigern.                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | Auf `true` setzen, um deaktivierte Gateway-Authentifizierung abzulehnen.                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | Auf `true` setzen, damit eine explizite Konfiguration der Authentifizierungs-Ratenbegrenzung erforderlich ist.                            |
| `gateway.controlUi.allowInsecure`       | Unsichere Authentifizierungs-, Geräte- und Ursprungs-Umschalter der Control UI | Auf `false` setzen, um Umschalter für eine unsichere Exposition der Control UI zu verweigern.                         |
| `gateway.remote.allow`                  | Remote-Gateway-Modus/-Konfiguration                     | Auf `false` setzen, um den Remote-Gateway-Modus zu verweigern.                                          |
| `gateway.http.denyEndpoints`            | HTTP-API-Endpunkte des Gateways                     | Endpunkt-IDs wie `chatCompletions` oder `responses` verweigern.                          |
| `gateway.http.requireUrlAllowlists`     | URL-Abrufeingaben der Gateway-HTTP-API                  | Auf `true` setzen, damit URL-Zulassungslisten für URL-Abrufeingaben erforderlich sind.                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.commands.deny`                  | Erfordern, dass exakte Node-Befehls-IDs wie `system.run` in der OpenClaw-Konfiguration verweigert werden. |

`gateway.nodes.denyCommands` ist eine exakte, zwischen Groß- und Kleinschreibung unterscheidende
Verweigerungs-Obermengenregel. Verwenden Sie sie, wenn die Richtlinie nachweisen muss, dass privilegierte
Node-Befehle durch die OpenClaw-Konfiguration ausdrücklich verweigert werden. Eine Bereitstellung, die einen
privilegierten Node-Befehl absichtlich zulässt, sollte nach der Überprüfung `policy.jsonc` aktualisieren,
anstatt sich ausschließlich auf `gateway.nodes.commands.allow` zu verlassen.

#### Agenten-Arbeitsbereich

| Richtlinienfeld                     | Beobachteter Zustand                                                                           | Verwenden, wenn                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` und `agents.entries.*.sandbox.workspaceAccess` | Nur Sandbox-Arbeitsbereichszugriffswerte wie `none` oder `ro` zulässig sein sollen.                       |
| `agents.workspace.denyTools`     | Globale und agentenspezifische Konfiguration zur Verweigerung von Tools                                                    | Mutationstools (`exec`, `process`, `write`, `edit`, `apply_patch`) verweigert werden müssen. |

#### Sandbox-Sicherheitsstatus

| Richtlinienfeld                                          | Beobachteter Zustand                                          | Verwenden, wenn                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` und agentenspezifischer Modus       | Nur überprüfte Sandbox-Modi wie `all` oder `non-main` zulässig sein sollen. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` und agentenspezifisches Backend | Nur überprüfte Sandbox-Backends wie `docker` zulässig sein sollen.         |
| `sandbox.containers.denyHostNetwork`                  | Netzwerkmodus der containergestützten Sandbox/des Browsers           | Der Host-Netzwerkmodus verweigert werden soll.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | Netzwerkmodus der containergestützten Sandbox/des Browsers           | Der Beitritt zum Netzwerk-Namespace eines anderen Containers verweigert werden soll.              |
| `sandbox.containers.requireReadOnlyMounts`            | Einbindungsmodus der containergestützten Sandbox/des Browsers             | Einbindungen schreibgeschützt sein müssen.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Einbindungsziele der containergestützten Sandbox/des Browsers          | Einbindungen von Container-Laufzeit-Sockets verweigert werden sollen.                          |
| `sandbox.containers.denyUnconfinedProfiles`           | Sicherheitsstatus des Container-Sicherheitsprofils                      | Uneingeschränkte Container-Sicherheitsprofile verweigert werden sollen.                   |
| `sandbox.browser.requireCdpSourceRange`               | CDP-Quellbereich des Sandbox-Browsers                        | Für die Browser-CDP-Exposition ein Quellbereich angegeben werden muss.        |

Die Richtlinie behandelt ein fehlendes `sandbox.mode` als dessen impliziten Standardwert `off`,
sodass `sandbox.requireMode` eine neue oder nicht konfigurierte Sandbox als außerhalb einer
Zulassungsliste wie `["all"]` meldet.

#### Datenverarbeitung

| Richtlinienfeld                                        | Beobachteter Zustand                                                                                     | Verwenden, wenn                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                                          | Auf `true` setzen, um `logging.redactSensitive: "off"` abzulehnen.              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                                  | Auf `true` setzen, um die Erfassung von Telemetrieinhalten abzulehnen.                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                                         | Auf `true` setzen, damit der effektive Sitzungswartungsmodus `enforce` erforderlich ist. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled`, `memory.search.experimental.sessionMemory` und agentenspezifische Überschreibungen | Auf `true` setzen, um die Indizierung von Sitzungstranskripten im Speicher abzulehnen.       |

#### Geheimnisse

| Richtlinienfeld                      | Beobachteter Zustand                                           | Verwenden, wenn                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs der Konfiguration und `secrets.providers.*`-Deklarationen | Auf `true` setzen, damit SecretRefs auf deklarierte Provider verweisen müssen.     |
| `secrets.denySources`             | Quellen von Geheimnis-Providern und SecretRef-Quellen            | Quellen wie `exec`, `file` oder einen anderen konfigurierten Quellnamen verweigern. |
| `secrets.allowInsecureProviders`  | Unsichere Sicherheitsstatus-Flags für Geheimnis-Provider                   | Auf `false` setzen, um Provider abzulehnen, die einen unsicheren Sicherheitsstatus aktivieren.      |

#### Ausführungsgenehmigungen

Prüfungen für Ausführungsgenehmigungen lesen das Laufzeitartefakt `exec-approvals.json`:
standardmäßig `~/.openclaw/exec-approvals.json` oder
`$OPENCLAW_STATE_DIR/exec-approvals.json`, wenn `OPENCLAW_STATE_DIR` gesetzt ist.
Sicherheitsstatusregeln unter `execApprovals.defaults.*` oder `execApprovals.agents.*`
erfordern lesbare Artefaktnachweise; ein fehlendes oder ungültiges Artefakt wird
als nicht beobachtbarer Nachweis statt als Best-Effort-Erfolg gemeldet. Sobald es lesbar ist,
übernehmen ausgelassene Felder die Laufzeitstandardwerte: Ein fehlendes `defaults.security` entspricht `full`,
und fehlende Agentensicherheit übernimmt diesen Standardwert. Der Nachweis umfasst `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, optional `argPattern`, den effektiven
`autoAllowSkills`-Sicherheitsstatus und die Eintragsquelle — niemals Socket-Pfad/-Token,
`commandText`, `lastUsedCommand`, aufgelöste Pfade oder Zeitstempel.

| Richtlinienfeld                            | Beobachteter Zustand                                                                  | Verwendung                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Aktiver Laufzeitpfad `exec-approvals.json`                                              | Auf `true` setzen, damit das Genehmigungsartefakt vorhanden und parsebar sein muss.                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, standardmäßig `full`                                              | Nur genehmigte standardmäßige Sicherheitsmodi für Genehmigungen zulassen.                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, wobei Standardwerte übernommen werden                                               | Nur genehmigte effektive Sicherheitsmodi für Genehmigungen pro Agent zulassen.                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` und `agents.*.autoAllowSkills`, wobei Laufzeitstandardwerte übernommen werden | Auf `false` setzen, um strikte manuelle Positivlisten ohne implizite Genehmigung der Skill-CLI zu verlangen. |
| `execApprovals.agents.allowlist.expected`   | Aggregiertes `agents.*.allowlist[]`-Muster und optionale argPattern-Einträge               | Verlangen, dass die Positivliste für Genehmigungen mit dem geprüften Mustersatz übereinstimmt.                      |

Beispiel: Das Genehmigungsartefakt verlangen, großzügige Standardwerte verweigern und
nur die geprüfte Ausführungsgenehmigungskonfiguration für ausgewählte Agenten zulassen.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Sicherheitsmodi: "deny", "allowlist" oder "full".
      // Dieser Standardwert erlaubt nur die streng eingeschränkte Verweigerungskonfiguration.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Ausgewählte Agenten dürfen die geprüfte Positivlistenkonfiguration verwenden, aber nicht "full".
          "allowSecurity": ["allowlist"],
          // false bedeutet, dass Skill-CLIs in der geprüften Positivliste aufgeführt sein müssen, statt
          // durch autoAllowSkills implizit genehmigt zu werden.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Einfacher Eintrag: exakt geprüftes Muster der ausführbaren Datei ohne argPattern.
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

| Richtlinienfeld                | Beobachteter Zustand                          | Verwendung                                                                                   |
| ------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Provider- und Modusmetadaten von `auth.profiles.*` | Metadatenschlüssel wie `provider` und `mode` für Authentifizierungsprofile in der Konfiguration verlangen.               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Nur unterstützte Authentifizierungsprofilmodi wie `api_key`, `aws-sdk`, `oauth` oder `token` zulassen. |

#### Tool-Metadaten

| Richtlinienfeld        | Beobachteter Zustand               | Verwendung                                                                                   |
| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Regulierte `TOOLS.md`-Deklarationen | Verlangen, dass regulierte Tools Metadatenschlüssel wie `risk`, `sensitivity` oder `owner` deklarieren. |

#### Tool-Konfiguration

| Richtlinienfeld                | Beobachteter Zustand                                         | Verwendung                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` und `agents.entries.*.tools.profile`        | Nur Tool-Profil-IDs wie `minimal`, `messaging` oder `coding` zulassen.                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` und agentenspezifische `tools.fs`-Überschreibungen | Auf `true` setzen, um eine auf den Arbeitsbereich beschränkte Konfiguration der Dateisystem-Tools zu verlangen.                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` und agentenspezifische Ausführungssicherheit           | Nur Sicherheitsmodi für die Ausführung wie `deny` oder `allowlist` zulassen.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` und agentenspezifischer Abfragemodus für die Ausführung                | Eine Genehmigungskonfiguration wie `always` verlangen.                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` und agentenspezifisches Host-Routing für die Ausführung           | Nur Host-Routing-Modi für die Ausführung wie `sandbox` zulassen.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` und agentenspezifische privilegierte Konfiguration     | Auf `false` setzen, damit der privilegierte Tool-Modus deaktiviert bleiben muss.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` und agentenspezifisches `tools.alsoAllow`           | Exakte `alsoAllow`-Einträge verlangen und fehlende oder unerwartete zusätzliche Tool-Berechtigungen melden.                 |
| `tools.denyTools`               | `tools.deny` und `agents.entries.*.tools.deny`              | Verlangen, dass konfigurierte Tool-Sperrlisten Tool-IDs oder Gruppen wie `group:runtime` und `group:fs` enthalten. |

## Prüfungen ausführen

Während der Erstellung ausschließlich Richtlinienprüfungen ausführen:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` führt nur den Satz von Richtlinienprüfungen aus und gibt Nachweise, Feststellungen
und Attestierungshashes aus. Dieselben Feststellungen erscheinen auch in
`openclaw doctor --lint`, wenn das Richtlinien-Plugin aktiviert ist.

Eine Operator-Richtliniendatei mit einer erstellten Baseline vergleichen:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` prüft die Syntax einer Richtliniendatei anhand der Syntax einer Richtliniendatei; dabei
werden weder Laufzeitzustand noch Nachweise, Anmeldedaten oder Geheimnisse untersucht. Es werden dieselben
Regelmetadaten verwendet, die bereichsbezogene Überlagerungen steuern: Positivlisten müssen gleich bleiben oder
enger werden, Sperrlisten müssen gleich bleiben oder weiter werden, erforderliche boolesche Werte müssen
ihren Wert beibehalten, geordnete Zeichenfolgen dürfen nur zum strengeren Ende der
konfigurierten Reihenfolge verschoben werden und exakte Listen müssen übereinstimmen. Die Baseline kann eine
von der Organisation erstellte Richtlinie sein; die geprüfte Richtlinie darf strengere Werte oder
zusätzliche Regeln enthalten. Eine geprüfte Regel auf oberster Ebene kann eine bereichsbezogene Baseline-Regel erfüllen, wenn
sie ebenso restriktiv oder restriktiver ist. Die Bereichsnamen müssen zwischen den
Dateien nicht übereinstimmen; der Vergleich erfolgt anhand von Selektor (`agentIds`/`channelIds`) und Feld.
Bei Routing-Prüfungen muss jede Baseline-Prüfungs-ID mit derselben Route
und demselben erwarteten Agenten erhalten bleiben. Eine geprüfte Richtlinie darf Prüfungen hinzufügen oder `matchedBy` einschränken, aber
das Entfernen einer Prüfung, das Ändern ihrer Route oder ihres Agenten oder das Erweitern ihrer akzeptierten Übereinstimmungsarten
ist weniger streng.

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

Eine erfolgreiche `policy check --json`-Ausgabe enthält stabile Hashes, die ein Operator oder
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

| Einstellung               | Zweck                                                           |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Richtlinienprüfungen aktivieren, noch bevor `policy.jsonc` vorhanden ist.         |
| `workspaceRepairs`        | `doctor --fix` erlauben, richtlinienverwaltete Arbeitsbereichseinstellungen zu bearbeiten. |
| `expectedHash`            | Optionale Hash-Sperre für das genehmigte Richtlinienartefakt.            |
| `expectedAttestationHash` | Optionale Hash-Sperre für die zuletzt akzeptierte erfolgreiche Richtlinienprüfung.    |
| `path`                    | Arbeitsbereichsrelativer Speicherort des Richtlinienartefakts.             |

`plugins.entries.policy.config.enabled` auf `false` setzen, um Richtlinienprüfungen
für einen Arbeitsbereich zu deaktivieren, während das Plugin installiert bleibt.

## Richtlinienzustand akzeptieren

Beispiel für eine JSON-Ausgabe:

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
erfasst den beobachteten OpenClaw-Zustand, den die Prüfungen verwenden, und
`workspace.hash` identifiziert diese Evidenznutzlast. `findingsHash` identifiziert
die genaue Befundmenge. `checkedAt` erfasst, wann die Prüfung ausgeführt wurde.
`attestationHash` identifiziert die stabile Aussage (Policy-Hash, Evidenz-Hash,
Befund-Hash und sauberer/geänderter Zustand) und schließt `checkedAt` bewusst aus,
sodass derselbe Policy-Zustand immer denselben Attestierungs-Hash erzeugt. Zusammen
bilden diese vier Werte das Audit-Tupel für eine Policy-Prüfung.

Wenn ein Gateway oder Supervisor anhand einer Policy eine Laufzeitaktion blockiert,
genehmigt oder mit Anmerkungen versieht, sollte er den Attestierungs-Hash der letzten
sauberen Prüfung erfassen. `checkedAt` verbleibt für Audit-Protokolle in der
JSON-Ausgabe, ist jedoch nicht Teil des stabilen Hashes.

Lebenszyklus zum Akzeptieren des Policy-Zustands:

1. Erstellen oder prüfen Sie `policy.jsonc`.
2. Führen Sie `openclaw policy check --json` aus.
3. Erfassen Sie bei einer sauberen Prüfung `attestation.policy.hash` als `expectedHash`.
4. Erfassen Sie `attestation.attestationHash` als `expectedAttestationHash`.
5. Führen Sie `openclaw doctor --lint` in CI- oder Release-Gates erneut aus.

Wenn Policy-Regeln absichtlich geändert werden, aktualisieren Sie beide akzeptierten
Hashes anhand einer sauberen Prüfung. Wenn sich nur Workspace-Einstellungen ändern
(die Policy bleibt unverändert), ändert sich in der Regel nur `expectedAttestationHash`.

Das Aktivieren oder Aktualisieren von `agents.workspace`-Regeln fügt dem Workspace-Hash
und dem Attestierungs-Hash `agentWorkspace`-Evidenz hinzu; prüfen Sie die neue Evidenz
und aktualisieren Sie nach der Aktivierung die akzeptierten Attestierungs-Hashes.
Das Aktivieren oder Aktualisieren von Regeln für die Tool-Sicherheitskonfiguration
fügt auf dieselbe Weise `toolPosture`-Evidenz hinzu.

`openclaw policy watch` führt die Prüfung erneut aus und meldet, wenn die aktuelle Evidenz
nicht mehr mit `expectedAttestationHash` übereinstimmt:

```bash
openclaw policy watch --json
```

Verwenden Sie `--once` in CI oder Skripten, die eine einzelne Driftbewertung
benötigen. Ohne `--once` erfolgt die Abfrage standardmäßig alle zwei Sekunden;
verwenden Sie `--interval-ms`, um das Intervall zu ändern.

## Befunde

| Prüf-ID                                                 | Feststellung                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Die Richtlinie ist aktiviert, aber `policy.jsonc` fehlt.                                  |
| `policy/policy-jsonc-invalid`                            | Die Richtlinie kann nicht geparst werden oder enthält fehlerhafte Regeleinträge.                       |
| `policy/policy-hash-mismatch`                            | Die Richtlinie stimmt nicht mit dem konfigurierten `expectedHash` überein.                                  |
| `policy/attestation-hash-mismatch`                       | Die aktuellen Richtliniennachweise stimmen nicht mehr mit der akzeptierten Attestierung überein.               |
| `policy/policy-conformance-invalid`                      | Eine Baseline- oder geprüfte Richtliniendatei enthält eine ungültige Vergleichssyntax.                  |
| `policy/policy-conformance-missing`                      | In einer geprüften Richtliniendatei fehlt eine Regel, die von der Baseline-Richtliniendatei gefordert wird.     |
| `policy/policy-conformance-weaker`                       | Eine geprüfte Richtliniendatei enthält einen schwächeren Wert als die Baseline-Richtliniendatei.           |
| `policy/channels-denied-provider`                        | Ein aktivierter Kanal entspricht einer Kanal-Ablehnungsregel.                                   |
| `policy/mcp-denied-server`                               | Ein konfigurierter MCP-Server wird durch die Richtlinie abgelehnt.                                      |
| `policy/mcp-unapproved-server`                           | Ein konfigurierter MCP-Server befindet sich nicht auf der Zulassungsliste.                                 |
| `policy/models-denied-provider`                          | Ein konfigurierter Modell-Provider oder eine Modellreferenz verwendet einen abgelehnten Provider.                  |
| `policy/models-unapproved-provider`                      | Ein konfigurierter Modell-Provider oder eine Modellreferenz befindet sich nicht auf der Zulassungsliste.                |
| `policy/network-private-access-enabled`                  | Eine SSRF-Ausnahmeregelung für private Netzwerke ist aktiviert, obwohl die Richtlinie dies untersagt.             |
| `policy/routing-bindings-required`                       | Die Richtlinie erfordert eine Kanalroutenbindung, aber es ist keine konfiguriert.                  |
| `policy/routing-binding-channel-unconfigured`            | Eine Routenbindung benennt einen Kanal, der in `channels.*` nicht vorhanden ist.                         |
| `policy/routing-agent-mismatch`                          | Eine definierte Route wird einem anderen Agenten zugeordnet.                                  |
| `policy/routing-match-kind-mismatch`                     | Eine definierte Route stimmt mit einer unerwarteten Bindungsspezifität überein.                   |
| `policy/ingress-dm-policy-unapproved`                    | Eine DM-Richtlinie für einen Kanal befindet sich nicht auf der Richtlinien-Zulassungsliste.                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` stimmt nicht mit dem von der Richtlinie geforderten DM-Isolationsumfang überein.          |
| `policy/ingress-open-groups-denied`                      | Eine Kanalgruppenrichtlinie ist `open`, obwohl die Richtlinie offenen Gruppeneingang untersagt.          |
| `policy/ingress-group-mention-required`                  | Ein Kanal- oder Gruppeneintrag deaktiviert Erwähnungsschranken, obwohl die Richtlinie sie erfordert.       |
| `policy/gateway-non-loopback-bind`                       | Die Gateway-Bindungskonfiguration erlaubt eine Exposition außerhalb der Loopback-Schnittstelle, obwohl die Richtlinie dies untersagt.         |
| `policy/gateway-auth-disabled`                           | Die Gateway-Authentifizierung ist deaktiviert, obwohl die Richtlinie Authentifizierung erfordert.                     |
| `policy/gateway-rate-limit-missing`                      | Die Ratenbegrenzungskonfiguration der Gateway-Authentifizierung ist nicht explizit festgelegt, obwohl die Richtlinie dies erfordert.          |
| `policy/gateway-control-ui-insecure`                     | Schalter für eine unsichere Exposition der Gateway Control UI sind aktiviert.                         |
| `policy/gateway-tailscale-funnel`                        | Die Exposition über Gateway Tailscale Funnel ist aktiviert, obwohl die Richtlinie dies untersagt.               |
| `policy/gateway-remote-enabled`                          | Der Gateway-Remote-Modus ist aktiv, obwohl die Richtlinie dies untersagt.                              |
| `policy/gateway-http-endpoint-enabled`                   | Ein Gateway-HTTP-API-Endpunkt ist aktiviert, obwohl die Richtlinie ihn untersagt.                    |
| `policy/gateway-http-url-fetch-unrestricted`             | Für die Gateway-HTTP-URL-Abrufeingabe fehlt eine erforderliche URL-Zulassungsliste.                      |
| `policy/gateway-node-command-denied`                     | Ein durch die Richtlinie abgelehnter Node-Befehl wird von der OpenClaw-Konfiguration nicht abgelehnt.                 |
| `policy/agents-workspace-access-denied`                  | Der Agenten-Sandbox-Modus oder der Arbeitsbereichszugriff befindet sich nicht auf der Richtlinien-Zulassungsliste.           |
| `policy/agents-tool-not-denied`                          | Eine Agenten- oder Standardkonfiguration lehnt ein von der Richtlinie vorgeschriebenes Tool nicht ab.               |
| `policy/tools-profile-unapproved`                        | Ein konfiguriertes globales oder agentenspezifisches Tool-Profil befindet sich nicht auf der Zulassungsliste.           |
| `policy/tools-fs-workspace-only-required`                | Dateisystem-Tools sind nicht ausschließlich für Pfade im Arbeitsbereich konfiguriert.             |
| `policy/tools-exec-security-unapproved`                  | Der Exec-Sicherheitsmodus befindet sich nicht auf der Richtlinien-Zulassungsliste.                               |
| `policy/tools-exec-ask-unapproved`                       | Der Exec-Rückfragemodus befindet sich nicht auf der Richtlinien-Zulassungsliste.                                    |
| `policy/tools-exec-host-unapproved`                      | Das Exec-Host-Routing befindet sich nicht auf der Richtlinien-Zulassungsliste.                                |
| `policy/tools-elevated-enabled`                          | Der Modus für privilegierte Tools ist aktiviert, obwohl die Richtlinie dies untersagt.                              |
| `policy/tools-also-allow-missing`                        | In einer konfigurierten `alsoAllow`-Liste fehlt ein von der Richtlinie vorgeschriebener Eintrag.             |
| `policy/tools-also-allow-unexpected`                     | Eine konfigurierte `alsoAllow`-Liste enthält einen Eintrag, den die Richtlinie nicht vorsieht.           |
| `policy/tools-required-deny-missing`                     | Eine globale oder agentenspezifische Tool-Ablehnungsliste enthält ein vorgeschriebenes abgelehntes Tool nicht.     |
| `policy/sandbox-mode-unapproved`                         | Der Sandbox-Modus befindet sich nicht auf der Richtlinien-Zulassungsliste.                                     |
| `policy/sandbox-backend-unapproved`                      | Das Sandbox-Backend befindet sich nicht auf der Richtlinien-Zulassungsliste.                                  |
| `policy/sandbox-container-posture-unobservable`          | Eine Container-Konfigurationsregel ist für ein Backend aktiviert, das sie nicht überwachen kann.         |
| `policy/sandbox-container-host-network-denied`           | Eine containerbasierte Sandbox oder ein containerbasierter Browser verwendet den Netzwerkmodus des Hosts.                     |
| `policy/sandbox-container-namespace-join-denied`         | Eine containerbasierte Sandbox oder ein containerbasierter Browser tritt dem Namespace eines anderen Containers bei.          |
| `policy/sandbox-container-mount-mode-required`           | Ein Mount einer containerbasierten Sandbox oder eines containerbasierten Browsers ist nicht schreibgeschützt.                     |
| `policy/sandbox-container-runtime-socket-mount`          | Ein Mount einer containerbasierten Sandbox oder eines containerbasierten Browsers legt den Socket der Container-Runtime offen. |
| `policy/sandbox-container-unconfined-profile`            | Das Container-Sandbox-Profil ist uneingeschränkt, obwohl die Richtlinie dies untersagt.                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | Der CDP-Quellbereich des Sandbox-Browsers fehlt, obwohl die Richtlinie einen solchen erfordert.             |
| `policy/data-handling-redaction-disabled`                | Die Schwärzung sensibler Protokolldaten ist deaktiviert, obwohl die Richtlinie sie erfordert.                  |
| `policy/data-handling-telemetry-content-capture`         | Die Erfassung von Telemetrieinhalten ist aktiviert, obwohl die Richtlinie dies untersagt.                       |
| `policy/data-handling-session-retention-not-enforced`    | Die Wartung der Sitzungsaufbewahrung wird nicht erzwungen, obwohl die Richtlinie dies erfordert.            |
| `policy/data-handling-session-transcript-memory-enabled` | Die Speicherindizierung von Sitzungstranskripten ist aktiviert, obwohl die Richtlinie dies untersagt.              |
| `policy/secrets-unmanaged-provider`                      | Eine SecretRef in der Konfiguration verweist auf einen Provider, der nicht unter `secrets.providers` deklariert ist.  |
| `policy/secrets-denied-provider-source`                  | Ein konfigurierter Secret-Provider oder eine SecretRef verwendet eine durch die Richtlinie abgelehnte Quelle.             |
| `policy/secrets-insecure-provider`                       | Ein Secret-Provider aktiviert eine unsichere Konfiguration, obwohl die Richtlinie dies untersagt.               |
| `policy/auth-profile-invalid-metadata`                   | In einem konfigurierten Authentifizierungsprofil fehlen gültige Provider- oder Modusmetadaten.                 |
| `policy/auth-profile-unapproved-mode`                    | Der Modus eines konfigurierten Authentifizierungsprofils befindet sich nicht auf der Richtlinien-Zulassungsliste.                       |
| `policy/exec-approvals-missing`                          | Die Richtlinie erfordert `exec-approvals.json`, aber das Artefakt fehlt.               |
| `policy/exec-approvals-invalid`                          | Das konfigurierte Artefakt für Exec-Genehmigungen kann nicht geparst werden.                          |
| `policy/exec-approvals-default-security-unapproved`      | Die Standardwerte für Exec-Genehmigungen verwenden einen Sicherheitsmodus, der sich nicht auf der Richtlinien-Zulassungsliste befindet.          |
| `policy/exec-approvals-agent-security-unapproved`        | Ein agentenspezifisch wirksamer Sicherheitsmodus für Exec-Genehmigungen befindet sich nicht auf der Zulassungsliste.       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Ein Exec-Genehmigungsagent erlaubt implizit automatisch Skills-CLIs, obwohl die Richtlinie dies untersagt.   |
| `policy/exec-approvals-allowlist-missing`                | In der Genehmigungs-Zulassungsliste fehlt ein von der Richtlinie vorgeschriebenes Muster.                  |
| `policy/exec-approvals-allowlist-unexpected`             | Die Genehmigungs-Zulassungsliste enthält ein Muster, das die Richtlinie nicht vorsieht.                |
| `policy/tools-missing-risk-level`                        | In einer richtliniengesteuerten Tool-Deklaration fehlen Risikometadaten.                             |
| `policy/tools-unknown-risk-level`                        | Eine richtliniengesteuerte Tool-Deklaration verwendet einen unbekannten Risikowert.                           |
| `policy/tools-missing-sensitivity-token`                 | In einer richtliniengesteuerten Tool-Deklaration fehlen Vertraulichkeitsmetadaten.                      |
| `policy/tools-missing-owner`                             | In einer richtliniengesteuerten Tool-Deklaration fehlen Eigentümermetadaten.                            |
| `policy/tools-unknown-sensitivity-token`                 | Eine richtliniengesteuerte Tool-Deklaration verwendet einen unbekannten Vertraulichkeitswert.                    |

Eine Feststellung kann sowohl `target` (das beobachtete Element im Arbeitsbereich, das
nicht konform ist) als auch `requirement` (die definierte Regel, durch die es zu einer Feststellung wurde) enthalten.
Beide sind derzeit `oc://`-Adresszeichenfolgen, aber die Feldnamen beschreiben die Rolle in der Richtlinie
und nicht das Adressformat.

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
  "fixHint": "Telegram ist für diesen Arbeitsbereich nicht genehmigt."
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
  "message": "Die Gateway-Bindungseinstellung 'gateway-bind' erlaubt eine Offenlegung außerhalb der Loopback-Schnittstelle.",
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
  "message": "Der Gateway-Node-Befehl 'system.run' ist durch die Richtlinie untersagt, aber nicht durch die OpenClaw-Konfiguration.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/commands/deny",
  "target": "oc://openclaw.config/gateway/nodes/commands/deny",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Fügen Sie 'system.run' zu gateway.nodes.commands.deny hinzu oder aktualisieren Sie die Richtlinie nach der Überprüfung."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "Der Sandbox-Arbeitsbereichszugriff 'rw' unter agents.defaults ist laut Richtlinie nicht zulässig.",
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
`workspaceRepairs` ausdrücklich aktiviert ist; andernfalls melden Prüfungen, was sie
reparieren würden, und lassen die Einstellungen unverändert.

In dieser Version kann die Reparatur durch `channels.denyRules` untersagte Kanäle deaktivieren und
die unten aufgeführten automatischen Einschränkungsreparaturen anwenden. Aktivieren Sie `workspaceRepairs`
erst, nachdem die Richtliniendatei überprüft wurde, da eine gültige Regel die
Arbeitsbereichskonfiguration ändern kann:

- `tools.elevated.enabled=false` festlegen, wenn eine globale Richtlinie Tools mit erweiterten Berechtigungen untersagt
- fehlende erforderliche Tool-IDs für die Sperrliste zu `tools.deny` oder
  `agents.entries.*.tools.deny` hinzufügen, wenn die Richtlinie verlangt, dass diese Tools untersagt werden
- unsichere `gateway.controlUi.*`-Schalter auf `false` setzen
- `gateway.mode=local` festlegen, wenn die Richtlinie den Remote-Gateway-Modus untersagt
- gemeldete `gateway.http.endpoints.*.enabled`-Pfade auf `false` setzen, wenn die Richtlinie
  Gateway-HTTP-API-Endpunkte untersagt
- gemeldete `groupPolicy`-Pfade für eingehenden Kanalverkehr auf `allowlist` setzen, wenn die Richtlinie
  offenen Gruppenzugriff untersagt
- gemeldete `requireMention`-Pfade für eingehenden Kanalverkehr auf `true` setzen, wenn die Richtlinie
  Gruppenerwähnungen verlangt
- `logging.redactSensitive=tools` festlegen, wenn die Richtlinie die Schwärzung
  sensibler Protokolldaten verlangt
- `diagnostics.otel.captureContent=false` oder
  `diagnostics.otel.captureContent.enabled=false` für Telemetrieerfassungseinstellungen
  in Objektform festlegen, wenn die Richtlinie die Erfassung von Telemetrieinhalten untersagt

Bereichsspezifische Reparaturen für Tools mit erweiterten Berechtigungen dienen nur der Erkennung. Bereichsspezifische Reparaturen der Datenverarbeitung werden
ebenfalls übersprungen, wenn der Befund eine gemeinsam verwendete Protokollierungs- oder Telemetriekonfiguration meldet,
da eine Änderung der gemeinsam verwendeten Einstellung mehr als das bereichsspezifische Richtlinienziel
betreffen würde.

Bereichsspezifische Reparaturen erforderlicher Sperrlisten werden übersprungen, wenn der Befund eine geerbte
Stammkonfiguration unter `tools.deny` meldet, da das Hinzufügen des erforderlichen Tools zur Stammkonfiguration
mehr als das bereichsspezifische Richtlinienziel betreffen würde. Agent-lokale Reparaturen erforderlicher Sperrlisten können
den gemeldeten `agents.entries.*.tools.deny`-Pfad aktualisieren.

Bereichsspezifische Reparaturen für eingehenden Kanalverkehr werden übersprungen, wenn der Befund geerbte
`channels.defaults.*` meldet, da eine Änderung des gemeinsam verwendeten Kanalstandards
mehr als das bereichsspezifische Richtlinienziel betreffen würde. Befunde zu Gateway-HTTP-URL-Abruf-Zulassungslisten
müssen weiterhin manuell behoben werden, da die automatische Reparatur nicht die richtigen
Zulassungslistenwerte für Endpunkt-URLs auswählen kann.

Befunde zu Gateway-Bindungen und Node-Befehlen erfordern weiterhin eine Überprüfung. Wenn
`policy/gateway-non-loopback-bind` oder `policy/gateway-node-command-denied`
einem Konfigurationspfad zugeordnet werden kann, meldet `doctor --fix` die vorgeschlagene
Änderung an `gateway.bind` oder `gateway.nodes.commands.deny` als übersprungene Vorschauhinweise.
Die Änderung wird nicht angewendet, und der Befund gilt erst dann als
repariert, wenn ein Betreiber die Konfiguration oder Richtlinie überprüft und aktualisiert hat.

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

| Befehl          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | Keine Befunde am Schwellenwert.                          | Mindestens ein Befund erreichte den Schwellenwert.                             | Argument- oder Laufzeitfehler. |
| `policy compare` | Die Richtliniendatei ist mindestens so streng wie die Baseline. | Die Richtliniendatei ist ungültig, fehlt oder ist schwächer als die Baseline-Regeln. | Argument- oder Laufzeitfehler. |
| `policy watch`   | Keine Befunde und der akzeptierte Hash ist aktuell.              | Es liegen Befunde vor oder der akzeptierte Nachweis ist veraltet.                    | Argument- oder Laufzeitfehler. |

## Verwandte Themen

- [Doctor-Lint-Modus](/de/cli/doctor#lint-mode)
- [Pfad-CLI](/de/cli/path)
