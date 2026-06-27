---
read_when:
    - Sie möchten OpenClaw-Einstellungen mit einer erstellten policy.jsonc abgleichen
    - Sie möchten Richtlinienbefunde in doctor lint
    - Sie benötigen einen Hash der Richtlinienbescheinigung als Audit-Nachweis
summary: CLI-Referenz für `openclaw policy`-Konformitätsprüfungen
title: Richtlinie
x-i18n:
    generated_at: "2026-06-27T17:20:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` wird vom gebündelten Policy-Plugin bereitgestellt. Policy ist eine
Enterprise-Konformitätsschicht über bestehenden OpenClaw-Einstellungen. Sie fügt
kein zweites Konfigurationssystem hinzu. `policy.jsonc` definiert verfasste
Anforderungen, OpenClaw beobachtet den aktiven Arbeitsbereich als Nachweis, und
Policy-Integritätsprüfungen melden Abweichungen über `doctor --lint`. Das
abschließende Konformitätssignal ist ein sauberer `doctor --lint`-Lauf; Policy
trägt Befunde zu dieser gemeinsamen Lint-Oberfläche bei, statt ein separates
Integritäts-Gate zu erstellen.

Policy verwaltet derzeit konfigurierte Kanäle, MCP-Server, Modell-Provider,
Netzwerk-SSRF-Haltung, Ingress-/Kanalzugriffshaltung, Gateway-Expositionshaltung,
Agent-Arbeitsbereichshaltung, Datenverarbeitungshaltung, OpenClaw-Konfigurationshaltung
für Secret-Provider/Auth-Profile sowie verwaltete Tool-Deklarationen. Beispielsweise
können IT oder ein Arbeitsbereichsbetreiber festhalten, dass Telegram kein
genehmigter Kanal-Provider ist, MCP-Server und Modellreferenzen auf genehmigte
Einträge beschränken, verlangen, dass Fetch-/Browser-Zugriff auf private Netzwerke
deaktiviert bleibt, verlangen, dass Direct-Message-Sitzungsisolierung und
Kanal-Ingress-Haltung innerhalb geprüfter Grenzen bleiben, verlangen, dass
Gateway-Bind/Auth/HTTP-Exposition innerhalb geprüfter Grenzen bleibt, verlangen,
dass Agent-Arbeitsbereichszugriff und Tool-Verweigerungen in einer geprüften
Haltung bleiben, verlangen, dass OpenClaw-Konfigurations-SecretRefs verwaltete
Provider verwenden, verlangen, dass Konfigurations-Auth-Profile Provider-/Modus-Metadaten
tragen, verlangen, dass verwaltete Tools Risiko- und Sensitivitätsmetadaten tragen,
sensible Logging-Redaktion verlangen, Telemetrie-Inhaltserfassung verweigern,
Sitzungsaufbewahrungswartung verlangen, Sitzungs-Transkript-Memory-Indexierung
verweigern und dann `doctor --lint` als gemeinsames Konformitäts-Gate verwenden.

Verwenden Sie Policy, wenn ein Arbeitsbereich eine dauerhafte Aussage benötigt,
etwa „diese Kanäle dürfen nicht aktiviert sein“ oder „verwaltete Tools müssen
Genehmigungsmetadaten deklarieren“, sowie eine wiederholbare Möglichkeit, zu
belegen, dass OpenClaw weiterhin dieser Aussage entspricht. Verwenden Sie nur
reguläre Konfiguration und Arbeitsbereichsdokumentation, wenn Sie lediglich
lokales Verhalten benötigen und keine Policy-Befunde oder Attestierungs-Ausgaben
brauchen.

## Schnellstart

Aktivieren Sie das gebündelte Policy-Plugin vor der ersten Verwendung:

```bash
openclaw plugins enable policy
```

Wenn Policy aktiviert ist, kann doctor Policy-Integritätsprüfungen laden, ohne
beliebige Plugins zu aktivieren. Das Plugin bleibt aktiviert, wenn `policy.jsonc`
fehlt, sodass doctor das fehlende Artefakt melden kann.

Policy wird verfasst und nicht aus den aktuellen Einstellungen des Benutzers
generiert. Eine minimale Policy für Kanäle, MCP-Server, Modell-Provider,
Netzwerkhaltung, Ingress-/Kanalzugriff, Gateway-Exposition, Agent-Arbeitsbereichshaltung,
konfigurierte Sandbox-Runtime-Haltung, OpenClaw-Datenverarbeitungshaltung,
Konfigurations-Secret-Provider-/Auth-Profil-Haltung, Exec-Genehmigungsdatei-Haltung
und Tool-Metadaten sieht so aus:

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

Die Regeln sind maßgeblich. Ein Kategorieblock ist nur ein Namespace; Prüfungen
laufen, wenn eine konkrete Regel vorhanden ist. OpenClaw liest die aktuellen
`channels.*`-Einstellungen, `mcp.servers.*`, `models.providers.*`, ausgewählte
Agent-Modellreferenzen, Netzwerk-SSRF-Einstellungen, Direct-Message-Sitzungsscope,
Kanal-DM-Policy, Kanalgruppen-Policy, Kanal-/Gruppen-Erwähnungs-Gates,
Gateway-Bind/Auth/Control UI/Tailscale/Remote/HTTP-Haltung, OpenClaw-Konfigurationshaltung
für Agent-Sandbox-Arbeitsbereichszugriff und Tool-Verweigerung, Konfigurationshaltung
zur Datenverarbeitung, Secret-Provider- und SecretRef-Herkunft der Konfiguration,
Metadaten von Konfigurations-Auth-Profilen, konfigurierte globale/pro-Agent-Tool-Haltung
und `TOOLS.md`-Deklarationen als Nachweise und meldet dann beobachteten Zustand,
der nicht konform ist. Wenn eine Policy Nicht-Loopback-Gateway-Binds verweigert,
lassen Sie `gateway.bind` nur weg, wenn Sie bereit sind, den Runtime-Standard zu
prüfen; setzen Sie `gateway.bind=loopback` für strikte Konfigurationskonformität.
Für eine schreibgeschützte Agent-Haltung konfigurieren Sie den Sandbox-Modus für
die jeweiligen Standards oder den Agent und setzen `workspaceAccess` auf `none`
oder `ro`; ein ausgelassener oder `off`-Sandbox-Modus erfüllt keine
schreibgeschützte/No-Write-Policy. `agents.workspace.denyTools` unterstützt
`exec`, `process`, `write`, `edit` und `apply_patch`; die OpenClaw-Konfiguration
`group:fs` deckt dateimutierende Tools ab, und `group:runtime` deckt Shell-/Prozess-Tools
ab. Tool-Haltungs-Policy beobachtet `tools.profile`, `tools.allow`,
`tools.alsoAllow`, `tools.deny`, `tools.fs.workspaceOnly`, `tools.exec.security`,
`tools.exec.ask`, `tools.exec.host`, `tools.elevated.enabled` und dieselben
pro-Agent-Overrides `agents.list[].tools.*`. Exec-Genehmigungs-Policy liest das
benannte Produktartefakt `exec-approvals.json` nur, wenn eine `execApprovals`-Regel
vorhanden ist; Nachweise erfassen Standards, pro-Agent-Haltung und Allowlist-Muster
ohne Socket-Token oder zuletzt verwendeten Befehlstext. Policy erzwingt Tool-Aufrufe
nicht zur Laufzeit. Secret-Nachweise erfassen Provider-/Quellenhaltung und
SecretRef-Metadaten, niemals rohe Secret-Werte. Policy liest oder attestiert
keine pro-Agent-Anmeldeinformationsspeicher wie `auth-profiles.json`; diese
Speicher bleiben Eigentum der bestehenden Auth- und Anmeldeinformationsflüsse.
Datenverarbeitungsnachweise sind ausschließlich Konfigurationshaltung: Geprüft
werden der konfigurierte Redaktionsmodus, Umschalter für Telemetrie-Inhaltserfassung,
Sitzungswartungsmodus und Einstellungen für Sitzungs-Transkript-Memory-Indexierung.
Rohlogs, Telemetrie-Exporte, Transkriptinhalte oder Memory-Dateien werden nicht
inspiziert, und es wird nicht bewiesen, dass keine personenbezogenen Daten oder
Secrets existieren.

### Policy-Regelreferenz

Jedes der folgenden Policy-Felder ist optional. Eine Prüfung läuft nur, wenn die
passende Regel in `policy.jsonc` vorhanden ist. Der beobachtete Zustand ist
bestehende OpenClaw-Konfiguration oder Arbeitsbereichsmetadaten; Policy meldet
Abweichungen, schreibt aber das Runtime-Verhalten nicht um, außer wenn ein
Reparaturpfad ausdrücklich verfügbar und aktiviert ist.
Policy-Dateien sind strikt: Nicht unterstützte Abschnitte oder Regelschlüssel
werden als `policy/policy-jsonc-invalid` gemeldet, statt ignoriert zu werden.

Policy-Overlays halten breite Regeln auf oberster Ebene global und lassen dann
benannte Scope-Blöcke strengere normale Policy-Abschnitte für explizite Selektoren
hinzufügen. Ein Scope-Name ist nur ein beschreibender Bucket; der Abgleich
verwendet die Selektorwerte innerhalb des Scopes. Das Overlay ist additiv:
Globale Ansprüche laufen weiterhin, und ein scoped Anspruch kann einen eigenen
Befund gegen dieselbe beobachtete Konfiguration ausgeben.

#### Scoped Overlays

Verwenden Sie `scopes.<scopeName>`, wenn eine Gruppe von Agents oder Kanälen eine
strengere Policy als die Baseline auf oberster Ebene benötigt. Agent-scoped
Abschnitte verwenden `agentIds`; dies unterstützt `tools.*`, `agents.workspace.*`,
`sandbox.*`, `dataHandling.memory.*` und `execApprovals.*`. Channel-scoped
Ingress verwendet `channelIds`; dies unterstützt `ingress.channels.*`. Nicht
unterstützte Abschnitte werden abgelehnt, statt ignoriert zu werden. Wenn ein
`agentIds`-Eintrag nicht in `agents.list[]` vorhanden ist, bewertet OpenClaw die
scoped Regel gegen die geerbte globale/Standardhaltung für diese Runtime-Agent-ID.

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

Derselbe Agent kann in mehreren Scopes erscheinen, wenn jeder Scope unterschiedliche
Felder verwaltet, wie oben gezeigt. Ein wiederholtes scoped Feld für denselben
Agent muss gemäß Policy-Metadaten gleich streng oder strenger sein; schwächere
doppelte Ansprüche werden abgelehnt. Striktheitsmetadaten behandeln Allow-Listen
als Teilmengen, Deny-Listen als Obermengen und erforderliche boolesche Werte als
feste Anforderungen.

Container-Haltungs-Policy wird nur gegen Nachweise ausgewertet, die OpenClaw für
den passenden Agent beobachten kann. Wenn eine aktivierte `sandbox.containers.*`-Regel
auf einen Agent angewendet wird, dessen Sandbox-Backend dieses Feld nicht
offenlegen kann, meldet Policy `policy/sandbox-container-posture-unobservable`,
statt den Anspruch als bestanden zu behandeln. Verwenden Sie separate `agentIds`-Scopes
für Agent-Gruppen, die unterschiedliche Sandbox-Backends verwenden, und lassen
Sie nicht unterstützte Container-Regeln für die Gruppen, bei denen diese Felder
nicht beobachtet werden können, unset oder false.

`ingress.session.requireDmScope` auf oberster Ebene bleibt global, weil
`session.dmScope` kein kanalzuordenbarer Nachweis ist.

| Selektor     | Unterstützte Abschnitte                                                            | Verwenden, wenn                                          |
| ------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory` und `execApprovals` | ein oder mehrere Laufzeit-Agents strengere Regeln benötigen. |
| `channelIds` | `ingress.channels`                                                                 | ein oder mehrere Kanäle strengere Ingress-Regeln benötigen. |

Jeder in `policy.jsonc` vorhandene Scope muss gültig und durchsetzbar sein.

#### Kanäle

| Policy-Feld                         | Beobachteter Zustand                    | Verwenden, wenn                                                     |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Provider und aktivierter Zustand von `channels.*` | konfigurierte Kanäle von einem Provider wie `telegram` abgelehnt werden sollen. |
| `channels.denyRules[].reason`        | Kontext für Fundmeldung und Reparaturhinweis | erklärt werden soll, warum der Provider abgelehnt wird.             |

#### MCP-Server

| Policy-Feld        | Beobachteter Zustand | Verwenden, wenn                                           |
| ------------------ | -------------------- | --------------------------------------------------------- |
| `mcp.servers.allow` | IDs von `mcp.servers.*` | jeder konfigurierte MCP-Server in einer Allowlist enthalten sein muss. |
| `mcp.servers.deny`  | IDs von `mcp.servers.*` | bestimmte konfigurierte MCP-Server-IDs abgelehnt werden sollen. |

#### Modell-Provider

| Policy-Feld             | Beobachteter Zustand                                  | Verwenden, wenn                                                                    |
| ----------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `models.providers.allow` | IDs von `models.providers.*` und ausgewählte Modell-Refs | konfigurierte Provider und ausgewählte Modell-Refs genehmigte Provider verwenden müssen. |
| `models.providers.deny`  | IDs von `models.providers.*` und ausgewählte Modell-Refs | konfigurierte Provider und ausgewählte Modell-Refs nach Provider-ID abgelehnt werden sollen. |

#### Netzwerk

| Policy-Feld                  | Beobachteter Zustand                  | Verwenden, wenn                                                        |
| ---------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `network.privateNetwork.allow` | SSRF-Ausnahmen für private Netzwerke | auf `false` setzen, um zu verlangen, dass Zugriff auf private Netzwerke deaktiviert bleibt. |

#### Ingress und Kanalzugriff

| Policy-Feld                              | Beobachteter Zustand                                           | Verwenden, wenn                                                        |
| ---------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | ein geprüfter Isolations-Scope für Direktnachrichten erforderlich ist. |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` und Legacy-DM-Policy-Felder für Kanäle  | nur geprüfte Kanal-Policies für Direktnachrichten erlaubt sein sollen. |
| `ingress.channels.denyOpenGroups`         | Ingress-Policy für Kanal, Konto und Gruppe                    | offener Gruppen-Ingress für konfigurierte Kanäle und Konten abgelehnt werden soll. |
| `ingress.channels.requireMentionInGroups` | Konfiguration für Mention-Gates für Kanal, Konto, Gruppe, Guild und verschachtelte Ebenen | Mention-Gates erforderlich sind, wenn Gruppen-Ingress offen oder mention-gated ist. |

#### Gateway

| Policy-Feld                            | Beobachteter Zustand                                | Verwenden, wenn                                                     |
| -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                     | auf `false` setzen, um Loopback-Gateway-Bindung zu verlangen.       |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale-Serve/Funnel-Gateway-Posture             | auf `false` setzen, um Tailscale-Funnel-Exposition abzulehnen.      |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                                | auf `true` setzen, um deaktivierte Gateway-Authentifizierung abzulehnen. |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                           | auf `true` setzen, um explizite Auth-Rate-Limit-Konfiguration zu verlangen. |
| `gateway.controlUi.allowInsecure`       | unsichere Auth-/Geräte-/Origin-Schalter der Control UI | auf `false` setzen, um unsichere Expositionsschalter der Control UI abzulehnen. |
| `gateway.remote.allow`                  | Remote-Gateway-Modus/-Konfiguration                | auf `false` setzen, um Remote-Gateway-Modus abzulehnen.             |
| `gateway.http.denyEndpoints`            | HTTP-API-Endpunkte des Gateway                     | Endpunkt-IDs wie `chatCompletions` oder `responses` ablehnen.       |
| `gateway.http.requireUrlAllowlists`      | URL-Fetch-Eingaben des Gateway-HTTP                | auf `true` setzen, um URL-Allowlists für URL-Fetch-Eingaben zu verlangen. |

#### Agent-Arbeitsbereich

| Policy-Feld                     | Beobachteter Zustand                                                                      | Verwenden, wenn                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` und `agents.list[].sandbox.workspaceAccess` | nur Sandbox-Arbeitsbereichszugriffswerte wie `none` oder `ro` erlaubt sein sollen.                                  |
| `agents.workspace.denyTools`     | globale und agent-spezifische Tool-Deny-Konfiguration                                | Arbeitsbereichs-/Laufzeit-Mutationstools wie `exec`, `process`, `write`, `edit` oder `apply_patch` abgelehnt werden müssen. |

#### Sandbox-Posture

| Policy-Feld                                          | Beobachteter Zustand                                      | Verwenden, wenn                                                   |
| ---------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` und agent-spezifischer Modus | nur geprüfte Sandbox-Modi wie `all` oder `non-main` erlaubt sein sollen. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` und agent-spezifisches Backend | nur geprüfte Sandbox-Backends wie `docker` erlaubt sein sollen.   |
| `sandbox.containers.denyHostNetwork`                  | Netzwerkmodus von containerbasierter Sandbox/browser      | Host-Netzwerkmodus abgelehnt werden soll.                         |
| `sandbox.containers.denyContainerNamespaceJoin`       | Netzwerkmodus von containerbasierter Sandbox/browser      | Beitritt zu einem anderen Container-Netzwerk-Namespace abgelehnt werden soll. |
| `sandbox.containers.requireReadOnlyMounts`            | Mount-Modus von containerbasierter Sandbox/browser        | Mounts schreibgeschützt sein müssen.                              |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Mount-Ziele von containerbasierter Sandbox/browser        | Container-Runtime-Socket-Mounts abgelehnt werden sollen.          |
| `sandbox.containers.denyUnconfinedProfiles`           | Posture des Container-Sicherheitsprofils                  | uneingeschränkte Container-Sicherheitsprofile abgelehnt werden sollen. |
| `sandbox.browser.requireCdpSourceRange`               | CDP-Quellbereich des Sandbox-Browsers                     | Browser-CDP-Exposition einen Quellbereich deklarieren muss.       |

Policy behandelt fehlendes `sandbox.mode` als impliziten Standardwert `off`,
sodass `sandbox.requireMode` eine frische oder nicht konfigurierte Sandbox als
außerhalb einer Allowlist wie `["all"]` meldet.

#### Datenverarbeitung

| Policy-Feld                                        | Beobachteter Zustand                                                                     | Verwenden, wenn                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                                | auf `true` setzen, um `logging.redactSensitive: "off"` abzulehnen.     |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                        | auf `true` setzen, um Telemetrie-Inhaltserfassung abzulehnen.          |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                               | auf `true` setzen, um den effektiven Sitzungswartungsmodus `enforce` zu verlangen. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` und `agents.*.memorySearch.experimental.sessionMemory` | auf `true` setzen, um Sitzungsprotokoll-Indexierung in den Speicher abzulehnen. |

#### Secrets

| Policy-Feld                      | Beobachteter Zustand                                      | Verwenden, wenn                                                          |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `secrets.requireManagedProviders` | Config-SecretRefs und Deklarationen von `secrets.providers.*` | auf `true` setzen, um zu verlangen, dass SecretRefs auf deklarierte Provider verweisen. |
| `secrets.denySources`             | Secret-Provider-Quellen und SecretRef-Quellen            | Quellen wie `exec`, `file` oder einen anderen konfigurierten Quellnamen ablehnen. |
| `secrets.allowInsecureProviders`  | unsichere Posture-Flags von Secret-Providern             | auf `false` setzen, um Provider abzulehnen, die sich für unsichere Posture entscheiden. |

#### Exec-Genehmigungen

Die Exec-Genehmigungs-Policy beobachtet das aktive Laufzeit-Artefakt
`exec-approvals.json`. Standardmäßig ist dies `~/.openclaw/exec-approvals.json`;
wenn `OPENCLAW_STATE_DIR` gesetzt ist, liest Policy
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Tatsächliche Posture-Regeln wie
`execApprovals.defaults.*` oder `execApprovals.agents.*` benötigen lesbare
Artefakt-Evidence; ein fehlendes oder ungültiges Artefakt wird als nicht
beobachtbare Evidence gemeldet, statt als Best-Effort-Pass gegen synthetische
Laufzeit-Defaults zu gelten. Sobald das Artefakt lesbar ist, erben ausgelassene
Genehmigungsfelder Laufzeit-Defaults: fehlendes `defaults.security` ist `full`,
und fehlende Agent-Sicherheit erbt diesen Standardwert. Evidence umfasst
`defaults`, `agents.*` und `agents.*.allowlist[].pattern` plus optionales
`argPattern`, effektive `autoAllowSkills`-Posture und Eintragsquelle. Sie enthält
nicht Socket-Pfad/-Token, `commandText`, `lastUsedCommand`, aufgelöste Pfade oder
Zeitstempel.

| Richtlinienfeld                            | Beobachteter Zustand                                                                  | Verwendung                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                | Aktiver Laufzeitpfad `exec-approvals.json`                                            | Auf `true` setzen, um zu verlangen, dass das Genehmigungsartefakt existiert und geparst wird.   |
| `execApprovals.defaults.allowSecurity`     | `defaults.security`, Standardwert `full`                                              | Nur genehmigte Standardsicherheitsmodi für Genehmigungen zulassen.                              |
| `execApprovals.agents.allowSecurity`       | `agents.*.security`, erbt Standards                                                   | Nur genehmigte effektive Sicherheitsmodi für Genehmigungen pro Agent zulassen.                  |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` und `agents.*.autoAllowSkills`, erbt Laufzeitstandards     | Auf `false` setzen, um strikte manuelle Allowlisten ohne implizite Skill-CLI-Genehmigung zu verlangen. |
| `execApprovals.agents.allowlist.expected`  | Aggregierte Muster `agents.*.allowlist[]` und optionale `argPattern`-Einträge         | Verlangen, dass die Genehmigungs-Allowlist dem geprüften Mustersatz entspricht.                 |

Verlangen Sie beispielsweise das Genehmigungsartefakt, verweigern Sie permissive Standards und
lassen Sie nur die geprüfte Exec-Genehmigungshaltung für ausgewählte Agenten zu:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

#### Auth-Profile

| Richtlinienfeld                | Beobachteter Zustand                          | Verwendung                                                                                         |
| ------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Provider- und Modus-Metadaten `auth.profiles.*` | Metadatenschlüssel wie `provider` und `mode` in Konfigurations-Auth-Profilen verlangen.            |
| `auth.profiles.allowModes`     | `auth.profiles.*.mode`                        | Nur unterstützte Auth-Profilmodi wie `api_key`, `aws-sdk`, `oauth` oder `token` zulassen.          |

#### Tool-Metadaten

| Richtlinienfeld        | Beobachteter Zustand          | Verwendung                                                                                         |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Verwaltete `TOOLS.md`-Deklarationen | Verlangen, dass verwaltete Tools Metadatenschlüssel wie `risk`, `sensitivity` oder `owner` deklarieren. |

#### Tool-Haltung

| Richtlinienfeld                 | Beobachteter Zustand                                      | Verwendung                                                                                              |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` und `agents.list[].tools.profile`         | Nur Tool-Profil-IDs wie `minimal`, `messaging` oder `coding` zulassen.                                   |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` und `tools.fs`-Überschreibungen pro Agent | Auf `true` setzen, um eine nur auf den Workspace beschränkte Dateisystem-Tool-Haltung zu verlangen.      |
| `tools.exec.allowSecurity`      | `tools.exec.security` und Exec-Sicherheit pro Agent       | Nur Exec-Sicherheitsmodi wie `deny` oder `allowlist` zulassen.                                           |
| `tools.exec.requireAsk`         | `tools.exec.ask` und Exec-Nachfragemodus pro Agent        | Genehmigungshaltung wie `always` verlangen.                                                             |
| `tools.exec.allowHosts`         | `tools.exec.host` und Exec-Host-Routing pro Agent         | Nur Exec-Host-Routing-Modi wie `sandbox` zulassen.                                                       |
| `tools.elevated.allow`          | `tools.elevated.enabled` und erhöhte Haltung pro Agent    | Auf `false` setzen, um zu verlangen, dass der erhöhte Tool-Modus deaktiviert bleibt.                     |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` und `tools.alsoAllow` pro Agent         | Exakte `alsoAllow`-Einträge verlangen und fehlende oder unerwartete additive Tool-Freigaben melden.      |
| `tools.denyTools`               | `tools.deny` und `agents.list[].tools.deny`               | Verlangen, dass konfigurierte Tool-Denylisten Tool-IDs oder Gruppen wie `group:runtime` und `group:fs` enthalten. |

Führen Sie während der Erstellung nur Richtlinienprüfungen aus:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` führt nur den Richtlinienprüfsatz aus und gibt Nachweise, Befunde und
Attestierungs-Hashes aus. Dieselben Befunde erscheinen auch in `openclaw doctor --lint`,
wenn das Policy-Plugin aktiviert ist.

Vergleichen Sie eine Operator-Richtliniendatei mit einer erstellten Baseline-Richtliniendatei:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` vergleicht Richtliniendateisyntax mit Richtliniendateisyntax. Es prüft
keinen OpenClaw-Laufzeitzustand, keine Nachweise, Zugangsdaten oder Geheimnisse. Der Befehl
verwendet dieselben Richtlinienregel-Metadaten, die bereichsbezogene Overlays steuern: Allowlisten müssen
gleich bleiben oder enger werden, Denylisten müssen gleich bleiben oder breiter werden, erforderliche boolesche Werte
müssen ihren erforderlichen Wert behalten, geordnete Zeichenfolgen dürfen sich nur zum restriktiveren
Ende der konfigurierten Reihenfolge bewegen, und exakte Listen müssen übereinstimmen.

Die Baseline-Datei kann eine von der Organisation erstellte Richtlinie sein. Die geprüfte Richtlinie kann
strengere Werte verwenden oder zusätzliche Richtlinienregeln hinzufügen. Eine geprüfte Regel auf oberster Ebene kann auch
eine bereichsbezogene Baseline-Regel erfüllen, wenn sie gleich restriktiv oder restriktiver ist, da
Richtlinien auf oberster Ebene breit gelten. Bereichsnamen müssen nicht übereinstimmen; der bereichsbezogene
Vergleich wird nach Selektorwert wie `agentIds` oder `channelIds` und nach
dem geprüften Richtlinienfeld geschlüsselt.

Beispielausgabe eines sauberen Vergleichs im JSON-Format meldet nur den Vergleichszustand der Richtliniendateien:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Beispielausgabe von sauberem `policy check --json` enthält stabile Hashes, die von einem
Operator oder Supervisor aufgezeichnet werden können:

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

| Einstellung               | Zweck                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| `enabled`                 | Richtlinienprüfungen aktivieren, auch bevor `policy.jsonc` existiert.  |
| `workspaceRepairs`        | `doctor --fix` erlauben, richtlinienverwaltete Workspace-Einstellungen zu bearbeiten. |
| `expectedHash`            | Optionaler Hash-Lock für das genehmigte Richtlinienartefakt.           |
| `expectedAttestationHash` | Optionaler Hash-Lock für die zuletzt akzeptierte saubere Richtlinienprüfung. |
| `path`                    | Workspace-relativer Speicherort des Richtlinienartefakts.              |

Setzen Sie `plugins.entries.policy.config.enabled` auf `false`, um Richtlinienprüfungen
für einen Workspace zu deaktivieren, während das Plugin installiert bleibt.

Tool-Metadatenanforderungen werden in `policy.jsonc` mit
`tools.requireMetadata` erstellt, zum Beispiel `["risk", "sensitivity", "owner"]`.

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

Der Policy-Hash identifiziert das verfasste Regelartefakt. Der Evidence-Block
zeichnet den beobachteten OpenClaw-Zustand auf, der von den Policy-Prüfungen verwendet wird. Der
Wert `workspace.hash` identifiziert diese Evidence-Nutzlast für den geprüften Scope.
Der Findings-Hash identifiziert die genaue Findings-Menge, die von der Prüfung zurückgegeben wurde.
`checkedAt` zeichnet auf, wann die Auswertung ausgeführt wurde. Der Attestation-Hash identifiziert
die stabile Aussage: Policy-Hash, Evidence-Hash, Findings-Hash und ob das
Ergebnis sauber war. Er enthält absichtlich nicht `checkedAt`, sodass derselbe
Policy-Zustand bei wiederholten Prüfungen dieselbe Attestation erzeugt. Zusammen
bilden diese das Audit-Tupel für diese Policy-Prüfung.

Wenn ein späterer Gateway oder Supervisor Policy verwendet, um eine
Runtime-Aktion zu blockieren, zu genehmigen oder zu annotieren, sollte er den Attestation-Hash der letzten sauberen Policy-Prüfung
aufzeichnen. `checkedAt` bleibt für Audit-Logs in der JSON-Ausgabe, ist aber nicht Teil des
stabilen Attestation-Hashs.

Verwenden Sie diesen Lebenszyklus beim Akzeptieren von Policy-Zustand:

1. Verfassen oder prüfen Sie `policy.jsonc`.
2. Führen Sie `openclaw policy check --json` aus.
3. Wenn das Ergebnis sauber ist, zeichnen Sie `attestation.policy.hash` als `expectedHash` auf.
4. Zeichnen Sie `attestation.attestationHash` als `expectedAttestationHash` auf.
5. Führen Sie `openclaw doctor --lint` in CI- oder Release-Gates erneut aus.

Wenn Policy-Regeln absichtlich geändert werden, aktualisieren Sie beide akzeptierten Hashes aus einer sauberen
Prüfung. Wenn Workspace-Einstellungen absichtlich geändert werden, die Policy aber gleich bleibt,
ändert sich normalerweise nur `expectedAttestationHash`.

Das Aktivieren oder Aktualisieren von `agents.workspace`-Regeln fügt dem
Workspace-Hash und dem Attestation-Hash `agentWorkspace`-Evidence hinzu. Operators sollten die neue
Evidence prüfen und akzeptierte Attestation-Hashes nach dem Aktivieren dieser Regeln aktualisieren.
Das Aktivieren oder Aktualisieren von Tool-Posture-Regeln fügt auf dieselbe Weise `toolPosture`-Evidence hinzu.

`openclaw policy watch` führt dieselbe Prüfung wiederholt aus und meldet, wenn die
aktuelle Evidence nicht mehr mit `expectedAttestationHash` übereinstimmt:

```bash
openclaw policy watch --json
```

Verwenden Sie `--once` in CI oder Skripten, die nur eine Drift-Auswertung benötigen. Ohne
`--once` pollt der Befehl standardmäßig alle zwei Sekunden; verwenden Sie `--interval-ms`, um
ein anderes Intervall auszuwählen.

## Findings

Policy prüft derzeit:

| Prüf-ID                                                  | Befund                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Richtlinie ist aktiviert, aber `policy.jsonc` fehlt.                              |
| `policy/policy-jsonc-invalid`                            | Richtlinie kann nicht geparst werden oder enthält fehlerhafte Regeleinträge.      |
| `policy/policy-hash-mismatch`                            | Richtlinie entspricht nicht dem konfigurierten `expectedHash`.                    |
| `policy/attestation-hash-mismatch`                       | Aktueller Richtliniennachweis stimmt nicht mehr mit der akzeptierten Attestierung überein. |
| `policy/policy-conformance-invalid`                      | Eine Baseline- oder geprüfte Richtliniendatei hat ungültige Vergleichssyntax.     |
| `policy/policy-conformance-missing`                      | Einer geprüften Richtliniendatei fehlt eine Regel, die von der Baseline-Richtliniendatei verlangt wird. |
| `policy/policy-conformance-weaker`                       | Eine geprüfte Richtliniendatei hat einen schwächeren Wert als die Baseline-Richtliniendatei. |
| `policy/channels-denied-provider`                        | Ein aktivierter Kanal entspricht einer Kanal-Ablehnungsregel.                     |
| `policy/mcp-denied-server`                               | Ein konfigurierter MCP-Server wird durch die Richtlinie abgelehnt.                |
| `policy/mcp-unapproved-server`                           | Ein konfigurierter MCP-Server liegt außerhalb der Allowlist.                      |
| `policy/models-denied-provider`                          | Ein konfigurierter Modell-Provider oder Modellverweis verwendet einen abgelehnten Provider. |
| `policy/models-unapproved-provider`                      | Ein konfigurierter Modell-Provider oder Modellverweis liegt außerhalb der Allowlist. |
| `policy/network-private-access-enabled`                  | Eine SSRF-Ausweichmöglichkeit für private Netzwerke ist aktiviert, obwohl die Richtlinie sie ablehnt. |
| `policy/ingress-dm-policy-unapproved`                    | Eine Kanal-DM-Richtlinie liegt außerhalb der Richtlinien-Allowlist.               |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` entspricht nicht dem von der Richtlinie verlangten DM-Isolationsumfang. |
| `policy/ingress-open-groups-denied`                      | Eine Kanalgruppenrichtlinie ist `open`, obwohl die Richtlinie offenen Gruppen-Ingress ablehnt. |
| `policy/ingress-group-mention-required`                  | Ein Kanal- oder Gruppeneintrag deaktiviert Erwähnungs-Gates, obwohl die Richtlinie sie verlangt. |
| `policy/gateway-non-loopback-bind`                       | Die Gateway-Bind-Haltung erlaubt Nicht-Loopback-Exponierung, obwohl die Richtlinie sie ablehnt. |
| `policy/gateway-auth-disabled`                           | Gateway-Authentifizierung ist deaktiviert, obwohl die Richtlinie Authentifizierung verlangt. |
| `policy/gateway-rate-limit-missing`                      | Die Gateway-Auth-Rate-Limit-Haltung ist nicht explizit, obwohl die Richtlinie sie verlangt. |
| `policy/gateway-control-ui-insecure`                     | Unsichere Exponierungs-Schalter der Gateway Control UI sind aktiviert.            |
| `policy/gateway-tailscale-funnel`                        | Gateway Tailscale Funnel-Exponierung ist aktiviert, obwohl die Richtlinie sie ablehnt. |
| `policy/gateway-remote-enabled`                          | Gateway-Remote-Modus ist aktiv, obwohl die Richtlinie ihn ablehnt.                |
| `policy/gateway-http-endpoint-enabled`                   | Ein Gateway-HTTP-API-Endpunkt ist aktiviert, obwohl er von der Richtlinie abgelehnt wird. |
| `policy/gateway-http-url-fetch-unrestricted`             | Der Gateway-HTTP-URL-Abrufeingabe fehlt eine erforderliche URL-Allowlist.         |
| `policy/agents-workspace-access-denied`                  | Agent-Sandbox-Modus oder Workspace-Zugriff liegt außerhalb der Richtlinien-Allowlist. |
| `policy/agents-tool-not-denied`                          | Eine Agent- oder Standardkonfiguration verweigert ein von der Richtlinie verlangtes Tool nicht. |
| `policy/tools-profile-unapproved`                        | Ein konfiguriertes globales oder agentenspezifisches Tool-Profil liegt außerhalb der Allowlist. |
| `policy/tools-fs-workspace-only-required`                | Dateisystem-Tools sind nicht mit Workspace-only-Pfadhaltung konfiguriert.         |
| `policy/tools-exec-security-unapproved`                  | Exec-Sicherheitsmodus liegt außerhalb der Richtlinien-Allowlist.                  |
| `policy/tools-exec-ask-unapproved`                       | Exec-Nachfragemodus liegt außerhalb der Richtlinien-Allowlist.                    |
| `policy/tools-exec-host-unapproved`                      | Exec-Host-Routing liegt außerhalb der Richtlinien-Allowlist.                      |
| `policy/tools-elevated-enabled`                          | Erhöhter Tool-Modus ist aktiviert, obwohl die Richtlinie ihn ablehnt.             |
| `policy/tools-also-allow-missing`                        | Einer konfigurierten `alsoAllow`-Liste fehlt ein von der Richtlinie verlangter Eintrag. |
| `policy/tools-also-allow-unexpected`                     | Eine konfigurierte `alsoAllow`-Liste enthält einen Eintrag, der von der Richtlinie nicht erwartet wird. |
| `policy/tools-required-deny-missing`                     | Eine globale oder agentenspezifische Tool-Ablehnungsliste enthält ein erforderliches abgelehntes Tool nicht. |
| `policy/sandbox-mode-unapproved`                         | Sandbox-Modus liegt außerhalb der Richtlinien-Allowlist.                          |
| `policy/sandbox-backend-unapproved`                      | Sandbox-Backend liegt außerhalb der Richtlinien-Allowlist.                        |
| `policy/sandbox-container-posture-unobservable`          | Eine Container-Haltungsregel ist für ein Backend aktiviert, das sie nicht beobachten kann. |
| `policy/sandbox-container-host-network-denied`           | Eine containerbasierte Sandbox oder ein Browser verwendet Host-Netzwerkmodus.     |
| `policy/sandbox-container-namespace-join-denied`         | Eine containerbasierte Sandbox oder ein Browser tritt einem anderen Container-Namespace bei. |
| `policy/sandbox-container-mount-mode-required`           | Ein Mount einer containerbasierten Sandbox oder eines Browsers ist nicht schreibgeschützt. |
| `policy/sandbox-container-runtime-socket-mount`          | Ein Mount einer containerbasierten Sandbox oder eines Browsers exponiert den Container-Runtime-Socket. |
| `policy/sandbox-container-unconfined-profile`            | Container-Sandbox-Profil ist unbeschränkt, obwohl die Richtlinie dies ablehnt.    |
| `policy/sandbox-browser-cdp-source-range-missing`        | Sandbox-Browser-CDP-Quellbereich fehlt, obwohl die Richtlinie einen verlangt.     |
| `policy/data-handling-redaction-disabled`                | Schwärzung sensibler Protokollierung ist deaktiviert, obwohl die Richtlinie sie verlangt. |
| `policy/data-handling-telemetry-content-capture`         | Telemetrie-Inhaltserfassung ist aktiviert, obwohl die Richtlinie sie ablehnt.     |
| `policy/data-handling-session-retention-not-enforced`    | Sitzungsaufbewahrungswartung wird nicht durchgesetzt, obwohl die Richtlinie sie verlangt. |
| `policy/data-handling-session-transcript-memory-enabled` | Sitzungsprotokoll-Speicherindexierung ist aktiviert, obwohl die Richtlinie sie ablehnt. |
| `policy/secrets-unmanaged-provider`                      | Eine Config SecretRef verweist auf einen Provider, der nicht unter `secrets.providers` deklariert ist. |
| `policy/secrets-denied-provider-source`                  | Ein Config-Secret-Provider oder SecretRef verwendet eine von der Richtlinie abgelehnte Quelle. |
| `policy/secrets-insecure-provider`                       | Ein Secret-Provider entscheidet sich für eine unsichere Haltung, obwohl die Richtlinie sie ablehnt. |
| `policy/auth-profile-invalid-metadata`                   | Ein Config-Auth-Profil enthält keine gültigen Provider- oder Modus-Metadaten.     |
| `policy/auth-profile-unapproved-mode`                    | Ein Config-Auth-Profilmodus liegt außerhalb der Richtlinien-Allowlist.            |
| `policy/exec-approvals-missing`                          | Richtlinie verlangt `exec-approvals.json`, aber das Artefakt fehlt.               |
| `policy/exec-approvals-invalid`                          | Das konfigurierte Exec-Genehmigungsartefakt kann nicht geparst werden.            |
| `policy/exec-approvals-default-security-unapproved`      | Exec-Genehmigungsstandards verwenden einen Sicherheitsmodus außerhalb der Richtlinien-Allowlist. |
| `policy/exec-approvals-agent-security-unapproved`        | Ein agentenspezifischer effektiver Exec-Genehmigungs-Sicherheitsmodus liegt außerhalb der Allowlist. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Ein Exec-Genehmigungs-Agent erlaubt Skill-CLIs implizit automatisch, obwohl die Richtlinie dies ablehnt. |
| `policy/exec-approvals-allowlist-missing`                | Der Genehmigungs-Allowlist fehlt ein von der Richtlinie verlangtes Muster.        |
| `policy/exec-approvals-allowlist-unexpected`             | Die Genehmigungs-Allowlist enthält ein Muster, das von der Richtlinie nicht erwartet wird. |
| `policy/tools-missing-risk-level`                        | Einer verwalteten Tool-Deklaration fehlen Risikometadaten.                        |
| `policy/tools-unknown-risk-level`                        | Eine verwaltete Tool-Deklaration verwendet einen unbekannten Risikowert.          |
| `policy/tools-missing-sensitivity-token`                 | Einer verwalteten Tool-Deklaration fehlen Sensitivitätsmetadaten.                 |
| `policy/tools-missing-owner`                             | Einer verwalteten Tool-Deklaration fehlen Eigentümermetadaten.                   |
| `policy/tools-unknown-sensitivity-token`                 | Eine verwaltete Tool-Deklaration verwendet einen unbekannten Sensitivitätswert.   |

Richtlinienbefunde können sowohl `target` als auch `requirement` enthalten. `target` ist das
beobachtete Workspace-Objekt, das nicht konform ist. `requirement` ist die verfasste
Richtlinienregel, die daraus einen Befund gemacht hat. Beide Werte sind heute Adressen, üblicherweise
`oc://`-Pfade, aber die Feldnamen beschreiben ihre Richtlinienrolle und nicht das
Adressformat.

Beispiel für einen JSON-Befund:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

Beispiel für einen Tool-Befund:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

Beispiel für einen MCP-Befund:

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

Beispiel für einen Modell-Provider-Befund:

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

Beispiel für einen Netzwerkbefund:

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

Beispielbefund zur Gateway-Exposition:

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

Beispielbefund zum Agent-Arbeitsbereich:

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
`workspaceRepairs` ausdrücklich aktiviert ist. Ohne diese Opt-in-Einstellung melden
Richtlinienprüfungen, was sie reparieren würden, und lassen die Einstellungen unverändert.

In dieser Version kann die Reparatur Kanäle deaktivieren, die in der OpenClaw-Konfiguration
aktiviert sind, aber durch `channels.denyRules` verweigert werden. Aktivieren Sie
`workspaceRepairs` erst, nachdem die Richtliniendatei geprüft wurde, da eine gültige
Verweigerungsregel einen konfigurierten Kanal deaktivieren kann:

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

| Befehl           | `0`                                                          | `1`                                                                     | `2`                           |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------- |
| `policy check`   | Keine Befunde, die den Schwellenwert erreichen.              | Ein oder mehrere Befunde haben den Schwellenwert erreicht.              | Argument- oder Laufzeitfehler. |
| `policy compare` | Die Richtliniendatei ist mindestens so streng wie die Basis. | Die Richtliniendatei ist ungültig, fehlt oder ist schwächer als Basisregeln. | Argument- oder Laufzeitfehler. |
| `policy watch`   | Keine Befunde und der akzeptierte Hash ist aktuell.          | Es liegen Befunde vor oder die akzeptierte Attestierung ist veraltet.   | Argument- oder Laufzeitfehler. |

## Verwandte Themen

- [Doctor-Lint-Modus](/de/cli/doctor#lint-mode)
- [Path-CLI](/de/cli/path)
