---
read_when:
    - U wilt OpenClaw-instellingen controleren aan de hand van een geschreven policy.jsonc
    - Je wilt beleidsbevindingen in doctor-lint
    - Je hebt een hash voor beleidsattestatie nodig als auditbewijs
summary: CLI-referentie voor `openclaw policy`-conformiteitscontroles
title: Beleid
x-i18n:
    generated_at: "2026-06-27T17:22:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` wordt geleverd door de gebundelde Policy-plugin. Policy is een
enterprise-conformiteitslaag boven op bestaande OpenClaw-instellingen. Het voegt
geen tweede configuratiesysteem toe. `policy.jsonc` definieert opgestelde vereisten,
OpenClaw observeert de actieve workspace als bewijs, en beleidshealthchecks
rapporteren drift via `doctor --lint`. Het uiteindelijke conformiteitssignaal is een schone
`doctor --lint`-run; policy draagt bevindingen bij aan dat gedeelde lint-oppervlak
in plaats van een afzonderlijke health-gate te maken.

Policy beheert momenteel geconfigureerde kanalen, MCP-servers, modelproviders,
netwerk-SSRF-houding, ingress-/kanaaltoegangshouding, Gateway-blootstellingshouding, agent-workspacehouding,
data-afhandelingshouding, OpenClaw-configuratiehouding voor secretprovider/auth-profiel, en beheerde tool-
declaraties. IT of een workspace-operator kan bijvoorbeeld vastleggen dat Telegram
geen goedgekeurde kanaalprovider is, MCP-servers en modelrefs beperken tot
goedgekeurde vermeldingen, vereisen dat fetch-/browsertoegang tot privénetwerken
uitgeschakeld blijft, vereisen dat directe-berichtsessie-isolatie en kanaalingresshouding
binnen beoordeelde grenzen blijven, vereisen dat Gateway-bind/auth/HTTP-blootstelling binnen beoordeelde
grenzen blijft, vereisen dat agent-workspacetoegang en tool-denies in een beoordeelde
houding blijven, vereisen dat OpenClaw-configuratie-SecretRefs beheerde providers gebruiken, vereisen dat
configuratie-auth-profielen provider-/modusmetadata bevatten, vereisen dat beheerde tools
risico- en gevoeligheidsmetadata bevatten, vereisen dat gevoelige logging wordt geredigeerd, vastlegging van
telemetrie-inhoud weigeren, onderhoud van sessieretentie vereisen, geheugenindexering van sessie-
transcripten weigeren, en daarna `doctor --lint` gebruiken als de gedeelde
conformiteitsgate.

Gebruik policy wanneer een workspace een duurzame verklaring nodig heeft, zoals "deze kanalen
mogen niet zijn ingeschakeld" of "beheerde tools moeten goedkeuringsmetadata declareren", en een
herhaalbare manier om te bewijzen dat OpenClaw nog steeds aan die verklaring voldoet. Gebruik
alleen reguliere configuratie en workspacedocumentatie wanneer u alleen lokaal gedrag nodig hebt en
geen beleidsbevindingen of attestatie-uitvoer nodig hebt.

## Snelstart

Schakel de gebundelde Policy-plugin in vóór het eerste gebruik:

```bash
openclaw plugins enable policy
```

Wanneer policy is ingeschakeld, kan doctor beleidshealthchecks laden zonder
willekeurige plugins te activeren. De plugin blijft ingeschakeld als `policy.jsonc` ontbreekt, zodat
doctor het ontbrekende artefact kan rapporteren.

Policy wordt opgesteld, niet gegenereerd uit de huidige instellingen van de gebruiker. Een minimaal
beleid voor kanalen, MCP-servers, modelproviders, netwerkhouding, ingress-/kanaaltoegang, Gateway-
blootstelling, agent-workspacehouding, geconfigureerde sandbox-runtimehouding, OpenClaw-
data-afhandelingshouding, configuratiehouding voor secretprovider/auth-profiel, exec-goedkeurings-
bestandshouding, en toolmetadata ziet er als volgt uit:

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

De regels zijn de autoriteit. Een categorieblok is alleen een namespace; controles worden uitgevoerd
wanneer er een concrete regel aanwezig is. OpenClaw leest huidige `channels.*`-instellingen,
`mcp.servers.*`, `models.providers.*`, geselecteerde agent-modelrefs, netwerk-SSRF-
instellingen, direct-message-sessiescope, kanaal-DM-beleid, kanaalgroepsbeleid,
kanaal-/groepsvermeldingsgates, Gateway-bind/auth/Control UI/Tailscale/remote/HTTP-
houding, OpenClaw-configuratie voor agent-sandbox-workspacetoegang en tool-denyhouding,
data-afhandelingsconfiguratiehouding, configuratie-secret-
provider en SecretRef-herkomst, configuratie-auth-profielmetadata, geconfigureerde
globale/per-agent-toolhouding, en `TOOLS.md`-declaraties als bewijs, en
rapporteert vervolgens geobserveerde staat die niet voldoet. Als een beleid non-loopback
Gateway-binds weigert, laat `gateway.bind` dan alleen weg wanneer u
bereid bent de runtime-standaard te beoordelen; stel `gateway.bind=loopback` in voor
strikte configuratieconformiteit. Voor een read-only agent-houding configureert u de sandboxmodus
op de toepasselijke defaults of agent en stelt u `workspaceAccess` in op `none` of
`ro`; een weggelaten of `off`-sandboxmodus voldoet niet aan een read-only/no-write-
beleid. `agents.workspace.denyTools` ondersteunt `exec`, `process`, `write`,
`edit`, en `apply_patch`; OpenClaw-configuratie `group:fs` dekt bestandsmutatietools
en `group:runtime` dekt shell-/procestools. Toolhoudingsbeleid observeert
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled`, en dezelfde per-agent-
`agents.list[].tools.*`-overrides. Exec-goedkeuringsbeleid leest het benoemde
`exec-approvals.json`-productartefact alleen wanneer een `execApprovals`-regel
aanwezig is; bewijs registreert defaults, per-agent-houding en allowlist-patronen
zonder sockettokens of laatst gebruikte opdrachttekst. Policy handhaaft tool-
aanroepen niet tijdens runtime. Secret-bewijs registreert
provider-/bronhouding en SecretRef-metadata, nooit ruwe secretwaarden. Policy
leest of attesteert geen per-agent-credentialstores zoals `auth-profiles.json`;
die stores blijven eigendom van de bestaande auth- en credentialflows.
Data-afhandelingsbewijs is alleen houding op configuratieniveau: het controleert de geconfigureerde
redactiemodus, toggles voor vastlegging van telemetrie-inhoud, sessieonderhoudsmodus, en
instellingen voor geheugenindexering van sessietranscripten. Het inspecteert geen ruwe logs,
telemetrie-exports, transcriptinhoud of geheugenbestanden, en bewijst niet dat er geen persoonlijke
gegevens of secrets bestaan.

### Naslag voor beleidsregels

Elk beleidsveld hieronder is optioneel. Een controle wordt alleen uitgevoerd wanneer de overeenkomende regel
aanwezig is in `policy.jsonc`. De geobserveerde staat is bestaande OpenClaw-configuratie of
workspacemetadata; policy rapporteert drift maar herschrijft runtimegedrag niet,
tenzij een herstelpad expliciet beschikbaar en ingeschakeld is.
Policy-bestanden zijn strikt: niet-ondersteunde secties of regelsleutels worden gerapporteerd als
`policy/policy-jsonc-invalid` in plaats van genegeerd.

Policy-overlays houden brede top-level regels globaal en laten daarna benoemde scopeblokken
strengere normale beleidssecties toevoegen voor expliciete selectors. Een scopenaam is alleen een
beschrijvende bucket; matching gebruikt de selectorwaarden binnen de scope.
De overlay is additief: globale claims worden nog steeds uitgevoerd, en een gescopete claim kan
een eigen bevinding tegen dezelfde geobserveerde configuratie emitten.

#### Gescopeerde overlays

Gebruik `scopes.<scopeName>` wanneer één set agents of kanalen strenger
beleid nodig heeft dan de top-level baseline. Agent-gescopeerde secties gebruiken `agentIds`, die
`tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`,
en `execApprovals.*` ondersteunt. Kanaal-gescopeerde
ingress gebruikt `channelIds`, die `ingress.channels.*` ondersteunt. Niet-ondersteunde
secties worden geweigerd in plaats van genegeerd. Als een `agentIds`-vermelding niet
aanwezig is in `agents.list[]`, evalueert OpenClaw de gescopeerde regel tegen geërfde
globale/default-houding voor die runtime-agent-id.

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

Dezelfde agent kan in meerdere scopes voorkomen wanneer elke scope verschillende
velden beheert, zoals hierboven getoond. Een herhaald gescopet veld voor dezelfde agent moet
even streng of strenger zijn volgens beleidsmetadata; zwakkere dubbele
claims worden geweigerd. Striktheidsmetadata behandelt allowlists als subsets,
denylists als supersets, en vereiste booleans als vaste vereisten.

Containerhoudingsbeleid wordt alleen geëvalueerd tegen bewijs dat OpenClaw kan
observeren voor de gematchte agent. Als een ingeschakelde `sandbox.containers.*`-regel van toepassing is
op een agent waarvan de sandboxbackend dat veld niet kan blootstellen, rapporteert policy
`policy/sandbox-container-posture-unobservable` in plaats van de claim als geslaagd
te behandelen. Gebruik afzonderlijke `agentIds`-scopes voor agentgroepen die verschillende
sandboxbackends gebruiken, en laat niet-ondersteunde containerregels uitgeschakeld of false voor de
groepen waar die velden niet kunnen worden geobserveerd.

Top-level `ingress.session.requireDmScope` blijft globaal omdat
`session.dmScope` geen kanaal-toewijsbaar bewijs is.

| Selector     | Ondersteunde secties                                                               | Gebruik wanneer                                                 |
| ------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | Een of meer runtime-agents strengere regels nodig hebben.       |
| `channelIds` | `ingress.channels`                                                                 | Een of meer kanalen strengere ingress-regels nodig hebben.      |

Elke scope die aanwezig is in `policy.jsonc` moet geldig en afdwingbaar zijn.

#### Kanalen

| Beleidsveld                         | Waargenomen status                     | Gebruik wanneer                                                  |
| ----------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | `channels.*`-provider en ingeschakelde status | Geconfigureerde kanalen van een provider zoals `telegram` weigeren. |
| `channels.denyRules[].reason`        | Bericht bij bevinding en context voor reparatietip | Uitleggen waarom de provider wordt geweigerd.                    |

#### MCP-servers

| Beleidsveld        | Waargenomen status | Gebruik wanneer                                                |
| ------------------ | ------------------ | -------------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*`-ids | Vereisen dat elke geconfigureerde MCP-server in een allowlist staat. |
| `mcp.servers.deny`  | `mcp.servers.*`-ids | Specifieke geconfigureerde MCP-server-ids weigeren.            |

#### Modelproviders

| Beleidsveld             | Waargenomen status                                  | Gebruik wanneer                                                                         |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*`-ids en geselecteerde modelrefs | Vereisen dat geconfigureerde providers en geselecteerde modelrefs goedgekeurde providers gebruiken. |
| `models.providers.deny`  | `models.providers.*`-ids en geselecteerde modelrefs | Geconfigureerde providers en geselecteerde modelrefs weigeren op provider-id.           |

#### Netwerk

| Beleidsveld                   | Waargenomen status                     | Gebruik wanneer                                                      |
| ----------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `network.privateNetwork.allow` | Private-network SSRF-uitwijkroutes     | Instellen op `false` om te vereisen dat private-network-toegang uitgeschakeld blijft. |

#### Ingress en kanaaltoegang

| Beleidsveld                              | Waargenomen status                                              | Gebruik wanneer                                                        |
| ---------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                               | Een beoordeelde isolatiescope voor directe berichten vereisen.         |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` en legacy DM-beleidsvelden voor kanalen   | Alleen beoordeelde kanaalbeleidsregels voor directe berichten toestaan. |
| `ingress.channels.denyOpenGroups`         | Ingress-beleid voor kanaal, account en groep                    | Open groeps-ingress weigeren voor geconfigureerde kanalen en accounts. |
| `ingress.channels.requireMentionInGroups` | Kanaal-, account-, groep-, guild- en geneste mention-gateconfiguratie | Mention-gates vereisen wanneer groeps-ingress open is of door mentions wordt afgeschermd. |

#### Gateway

| Beleidsveld                            | Waargenomen status                              | Gebruik wanneer                                                    |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                  | Instellen op `false` om loopback-Gateway-binding te vereisen.      |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel-Gateway-houding          | Instellen op `false` om Tailscale Funnel-blootstelling te weigeren. |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                             | Instellen op `true` om uitgeschakelde Gateway-auth te weigeren.    |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                        | Instellen op `true` om expliciete auth-rate-limit-configuratie te vereisen. |
| `gateway.controlUi.allowInsecure`       | Onveilige auth/device/origin-schakelaars van Control UI | Instellen op `false` om onveilige blootstellingsschakelaars van Control UI te weigeren. |
| `gateway.remote.allow`                  | Remote Gateway-modus/configuratie               | Instellen op `false` om remote Gateway-modus te weigeren.          |
| `gateway.http.denyEndpoints`            | Gateway HTTP API-eindpunten                     | Eindpunt-ids zoals `chatCompletions` of `responses` weigeren.      |
| `gateway.http.requireUrlAllowlists`      | Gateway HTTP URL-fetch-invoer                   | Instellen op `true` om URL-allowlists te vereisen voor URL-fetch-invoer. |

#### Agent-werkruimte

| Beleidsveld                     | Waargenomen status                                                                       | Gebruik wanneer                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` en `agents.list[].sandbox.workspaceAccess`     | Alleen sandbox-werkruimtetoegangswaarden zoals `none` of `ro` toestaan.                                                    |
| `agents.workspace.denyTools`     | Globale en per-agent tool-weigerconfiguratie                                             | Vereisen dat mutatietools voor werkruimte/runtime zoals `exec`, `process`, `write`, `edit` of `apply_patch` worden geweigerd. |

#### Sandbox-houding

| Beleidsveld                                          | Waargenomen status                                         | Gebruik wanneer                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` en modus per agent          | Alleen beoordeelde sandbox-modi zoals `all` of `non-main` toestaan. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` en backend per agent     | Alleen beoordeelde sandbox-backends zoals `docker` toestaan.       |
| `sandbox.containers.denyHostNetwork`                  | Netwerkmodus van container-backed sandbox/browser          | Hostnetwerkmodus weigeren.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | Netwerkmodus van container-backed sandbox/browser          | Deelnemen aan de netwerknamespace van een andere container weigeren. |
| `sandbox.containers.requireReadOnlyMounts`            | Mountmodus van container-backed sandbox/browser            | Vereisen dat mounts alleen-lezen zijn.                            |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Mountdoelen van container-backed sandbox/browser           | Mounts van container-runtime-sockets weigeren.                    |
| `sandbox.containers.denyUnconfinedProfiles`           | Houding van containerbeveiligingsprofielen                 | Unconfined containerbeveiligingsprofielen weigeren.               |
| `sandbox.browser.requireCdpSourceRange`               | CDP-bronbereik van sandbox-browser                         | Vereisen dat browser-CDP-blootstelling een bronbereik declareert. |

Policy behandelt ontbrekende `sandbox.mode` als de impliciete standaard `off`, waardoor
`sandbox.requireMode` een nieuwe of niet-geconfigureerde sandbox rapporteert als buiten een
allowlist zoals `["all"]`.

#### Gegevensverwerking

| Beleidsveld                                        | Waargenomen status                                                                      | Gebruik wanneer                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                               | Instellen op `true` om `logging.redactSensitive: "off"` te weigeren.  |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                       | Instellen op `true` om telemetry-contentcapture te weigeren.          |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                              | Instellen op `true` om effectieve sessieonderhoudsmodus `enforce` te vereisen. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` en `agents.*.memorySearch.experimental.sessionMemory`     | Instellen op `true` om indexering van sessietranscripten naar memory te weigeren. |

#### Geheimen

| Beleidsveld                      | Waargenomen status                                           | Gebruik wanneer                                                         |
| -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Config SecretRefs en `secrets.providers.*`-declaraties       | Instellen op `true` om te vereisen dat SecretRefs naar gedeclareerde providers verwijzen. |
| `secrets.denySources`             | Bronnen van secret-providers en SecretRef-bronnen             | Bronnen zoals `exec`, `file` of een andere geconfigureerde bronnaam weigeren. |
| `secrets.allowInsecureProviders`  | Onveilige houdingsvlaggen van secret-providers               | Instellen op `false` om providers te weigeren die kiezen voor een onveilige houding. |

#### Exec-goedkeuringen

Het beleid voor exec-goedkeuringen observeert het actieve runtime-artefact
`exec-approvals.json`. Standaard is dit `~/.openclaw/exec-approvals.json`; wanneer
`OPENCLAW_STATE_DIR` is ingesteld, leest Policy
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Feitelijke houdingsregels zoals
`execApprovals.defaults.*` of `execApprovals.agents.*` vereisen leesbaar
artefactbewijs; een ontbrekend of ongeldig artefact wordt gerapporteerd als
niet-observeerbaar bewijs in plaats van een best-effort pass te worden tegen synthetische
runtime-standaarden. Zodra het artefact leesbaar is, erven weggelaten goedkeuringsvelden
runtime-standaarden: ontbrekende `defaults.security` is `full`, en ontbrekende
agentbeveiliging erft die standaard. Bewijs omvat `defaults`, `agents.*` en
`agents.*.allowlist[].pattern` plus optioneel `argPattern`, effectieve
`autoAllowSkills`-houding en invoerbron. Het omvat geen socketpad/token,
`commandText`, `lastUsedCommand`, opgeloste paden of tijdstempels.

| Beleidsveld                                | Waargenomen status                                                                         | Gebruiken wanneer                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Pad van actief runtime-`exec-approvals.json`                                              | Stel in op `true` om te vereisen dat het goedkeuringsartefact bestaat en kan worden geparset.                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, standaard ingesteld op `full`                                              | Sta alleen goedgekeurde standaardbeveiligingsmodi voor goedkeuring toe.                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, overgenomen van standaarden                                               | Sta alleen goedgekeurde effectieve beveiligingsmodi voor goedkeuring per agent toe.                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` en `agents.*.autoAllowSkills`, overgenomen van runtime-standaarden | Stel in op `false` om strikte handmatige allowlists te vereisen zonder impliciete Skills-CLI-goedkeuring. |
| `execApprovals.agents.allowlist.expected`   | Geaggregeerd `agents.*.allowlist[]`-patroon en optionele argPattern-vermeldingen               | Vereis dat de goedkeurings-allowlist overeenkomt met de beoordeelde patroonset.                      |

Vereis bijvoorbeeld het goedkeuringsartefact, weiger permissieve standaarden en
sta alleen een beoordeelde exec-goedkeuringshouding toe voor geselecteerde agents:

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

#### Auth-profielen

| Beleidsveld                    | Waargenomen status                               | Gebruiken wanneer                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` provider- en modusmetadata | Vereis metadatasleutels zoals `provider` en `mode` op configuratie-auth-profielen.               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Sta alleen ondersteunde auth-profielmodi toe, zoals `api_key`, `aws-sdk`, `oauth` of `token`. |

#### Toolmetadata

| Beleidsveld            | Waargenomen status                   | Gebruiken wanneer                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Beheerde `TOOLS.md`-declaraties | Vereis dat beheerde tools metadatasleutels declareren, zoals `risk`, `sensitivity` of `owner`. |

#### Toolhouding

| Beleidsveld                    | Waargenomen status                                              | Gebruiken wanneer                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` en `agents.list[].tools.profile`           | Sta alleen toolprofiel-id's toe, zoals `minimal`, `messaging` of `coding`.                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` en per-agent `tools.fs`-overrides | Stel in op `true` om een bestandssysteemtoolhouding te vereisen die alleen de workspace gebruikt.                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` en exec-beveiliging per agent           | Sta alleen exec-beveiligingsmodi toe, zoals `deny` of `allowlist`.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` en exec-vraagmodus per agent                | Vereis een goedkeuringshouding zoals `always`.                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` en exec-hostroutering per agent           | Sta alleen exec-hostrouteringsmodi toe, zoals `sandbox`.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` en verhoogde houding per agent     | Stel in op `false` om te vereisen dat verhoogde toolmodus uitgeschakeld blijft.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` en per-agent `tools.alsoAllow`           | Vereis exacte `alsoAllow`-vermeldingen en rapporteer ontbrekende of onverwachte aanvullende toolrechten.                 |
| `tools.denyTools`               | `tools.deny` en `agents.list[].tools.deny`                 | Vereis dat geconfigureerde tool-weigerlijsten tool-id's of groepen bevatten, zoals `group:runtime` en `group:fs`. |

Voer tijdens het schrijven alleen-beleidscontroles uit:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` voert alleen de set beleidscontroles uit en geeft bewijs, bevindingen en
attestatiehashes uit. Dezelfde bevindingen verschijnen ook in `openclaw doctor --lint`
wanneer de Policy plugin is ingeschakeld.

Vergelijk een operatorbeleidsbestand met een geschreven baseline-beleidsbestand:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` vergelijkt syntaxis van beleidsbestanden met syntaxis van beleidsbestanden. Het
inspecteert geen OpenClaw-runtime-status, bewijs, referenties of geheimen. De opdracht
gebruikt dezelfde metadata voor beleidsregels die scoped overlays beheert: allowlists moeten
gelijk of smaller blijven, denylists moeten gelijk of breder blijven, vereiste booleans
moeten hun vereiste waarde behouden, geordende strings mogen alleen naar het restrictievere
uiteinde van de geconfigureerde volgorde bewegen, en exacte lijsten moeten overeenkomen.

Het baselinebestand kan een door een organisatie geschreven beleid zijn. Het gecontroleerde beleid kan
striktere waarden gebruiken of extra beleidsregels toevoegen. Een gecontroleerde regel op topniveau kan ook
voldoen aan een scoped baseline-regel wanneer deze even restrictief of restrictiever is, omdat
beleid op topniveau breed van toepassing is. Scopenamen hoeven niet overeen te komen; scoped
vergelijking wordt bepaald door selectorwaarde zoals `agentIds` of `channelIds` en door
het beleidsveld dat wordt gecontroleerd.

Voorbeeld van schone vergelijkingsuitvoer in JSON rapporteert alleen de vergelijkingsstatus van beleidsbestanden:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Voorbeeld van schone `policy check --json`-uitvoer bevat stabiele hashes die kunnen worden
vastgelegd door een operator of supervisor:

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

## Beleid configureren

Beleidsconfiguratie bevindt zich onder `plugins.entries.policy.config`.

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

| Instelling                   | Doel                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Schakel beleidscontroles in, zelfs voordat `policy.jsonc` bestaat.         |
| `workspaceRepairs`        | Sta toe dat `doctor --fix` door beleid beheerde workspace-instellingen bewerkt. |
| `expectedHash`            | Optionele hashvergrendeling voor het goedgekeurde beleidsartefact.            |
| `expectedAttestationHash` | Optionele hashvergrendeling voor de laatst geaccepteerde schone beleidscontrole.    |
| `path`                    | Workspace-relatieve locatie van het beleidsartefact.             |

Stel `plugins.entries.policy.config.enabled` in op `false` om beleidscontroles
voor een workspace uit te schakelen terwijl de plugin geinstalleerd blijft.

Vereisten voor toolmetadata worden geschreven in `policy.jsonc` met
`tools.requireMetadata`, bijvoorbeeld `["risk", "sensitivity", "owner"]`.

## Beleidsstatus accepteren

Voorbeeld van JSON-uitvoer:

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

De beleidshash identificeert het opgestelde regelartefact. Het bewijsblok
registreert de waargenomen OpenClaw-status die door de beleidscontroles is gebruikt. De
waarde `workspace.hash` identificeert die bewijs-payload voor de gecontroleerde scope.
De bevindingenhash identificeert de exacte set bevindingen die door de controle is geretourneerd.
`checkedAt` registreert wanneer de evaluatie is uitgevoerd. De attestatiehash identificeert
de stabiele claim: beleidshash, bewijshash, bevindingenhash en of het
resultaat schoon was. Deze bevat bewust geen `checkedAt`, zodat dezelfde
beleidsstatus dezelfde attestatie oplevert bij herhaalde controles. Samen
vormen deze de audit-tuple voor deze beleidscontrole.

Als een latere Gateway of supervisor beleid gebruikt om een runtime-actie te blokkeren,
goed te keuren of te annoteren, moet deze de attestatiehash van de laatste schone beleidscontrole
registreren. `checkedAt` blijft in JSON-uitvoer staan voor auditlogs, maar maakt geen deel uit van de
stabiele attestatiehash.

Gebruik deze levenscyclus bij het accepteren van beleidsstatus:

1. Stel `policy.jsonc` op of review het.
2. Voer `openclaw policy check --json` uit.
3. Als het resultaat schoon is, registreer `attestation.policy.hash` als `expectedHash`.
4. Registreer `attestation.attestationHash` als `expectedAttestationHash`.
5. Voer `openclaw doctor --lint` opnieuw uit in CI- of releasepoorten.

Als beleidsregels bewust veranderen, werk dan beide geaccepteerde hashes bij op basis van een schone
controle. Als workspace-instellingen bewust veranderen maar het beleid hetzelfde blijft,
verandert meestal alleen `expectedAttestationHash`.

Het inschakelen of upgraden van `agents.workspace`-regels voegt `agentWorkspace`-bewijs toe aan
de workspace-hash en attestatiehash. Operators moeten het nieuwe
bewijs reviewen en geaccepteerde attestatiehashes vernieuwen nadat ze deze regels hebben ingeschakeld.
Het inschakelen of upgraden van regels voor toolhouding voegt op dezelfde
manier `toolPosture`-bewijs toe.

`openclaw policy watch` voert dezelfde controle herhaaldelijk uit en rapporteert wanneer het
huidige bewijs niet langer overeenkomt met `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Gebruik `--once` in CI of scripts die slechts één driftevaluatie nodig hebben. Zonder
`--once` pollt de opdracht standaard elke twee seconden; gebruik `--interval-ms` om
een ander interval te kiezen.

## Bevindingen

Beleid verifieert momenteel:

| Controle-id                                             | Bevinding                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Beleid is ingeschakeld, maar `policy.jsonc` ontbreekt.                            |
| `policy/policy-jsonc-invalid`                            | Beleid kan niet worden geparseerd of bevat ongeldige regelvermeldingen.           |
| `policy/policy-hash-mismatch`                            | Beleid komt niet overeen met geconfigureerde `expectedHash`.                      |
| `policy/attestation-hash-mismatch`                       | Huidig beleidsbewijs komt niet meer overeen met de geaccepteerde attestatie.      |
| `policy/policy-conformance-invalid`                      | Een basislijn- of gecontroleerd beleidsbestand heeft ongeldige vergelijkingssyntaxis. |
| `policy/policy-conformance-missing`                      | Een gecontroleerd beleidsbestand mist een regel die vereist is door het basislijnbeleidsbestand. |
| `policy/policy-conformance-weaker`                       | Een gecontroleerd beleidsbestand heeft een zwakkere waarde dan het basislijnbeleidsbestand. |
| `policy/channels-denied-provider`                        | Een ingeschakeld kanaal komt overeen met een kanaalweigerregel.                   |
| `policy/mcp-denied-server`                               | Een geconfigureerde MCP-server wordt door beleid geweigerd.                       |
| `policy/mcp-unapproved-server`                           | Een geconfigureerde MCP-server staat buiten de toelatingslijst.                   |
| `policy/models-denied-provider`                          | Een geconfigureerde modelprovider of modelverwijzing gebruikt een geweigerde provider. |
| `policy/models-unapproved-provider`                      | Een geconfigureerde modelprovider of modelverwijzing staat buiten de toelatingslijst. |
| `policy/network-private-access-enabled`                  | Een SSRF-ontsnappingsmechanisme voor privénetwerken is ingeschakeld terwijl beleid dit weigert. |
| `policy/ingress-dm-policy-unapproved`                    | Een kanaal-DM-beleid staat buiten de beleidstoelatingslijst.                      |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` komt niet overeen met het door beleid vereiste DM-isolatiebereik. |
| `policy/ingress-open-groups-denied`                      | Een kanaalgroepsbeleid is `open` terwijl beleid open groepsingang weigert.        |
| `policy/ingress-group-mention-required`                  | Een kanaal- of groepsvermelding schakelt vermeldingspoorten uit terwijl beleid ze vereist. |
| `policy/gateway-non-loopback-bind`                       | Gateway-bindhouding staat niet-loopback-blootstelling toe terwijl beleid dit weigert. |
| `policy/gateway-auth-disabled`                           | Gateway-authenticatie is uitgeschakeld terwijl beleid authenticatie vereist.      |
| `policy/gateway-rate-limit-missing`                      | Gateway-authenticatie-ratelimit-houding is niet expliciet terwijl beleid dit vereist. |
| `policy/gateway-control-ui-insecure`                     | Onveilige blootstellingsschakelaars voor de Gateway Control UI zijn ingeschakeld. |
| `policy/gateway-tailscale-funnel`                        | Gateway Tailscale Funnel-blootstelling is ingeschakeld terwijl beleid dit weigert. |
| `policy/gateway-remote-enabled`                          | Gateway-externe modus is actief terwijl beleid dit weigert.                       |
| `policy/gateway-http-endpoint-enabled`                   | Een Gateway HTTP API-eindpunt is ingeschakeld terwijl beleid dit weigert.         |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL-fetch-invoer mist een vereiste URL-toelatingslijst.              |
| `policy/agents-workspace-access-denied`                  | Agent-sandboxmodus of werkruimtetoegang staat buiten de beleidstoelatingslijst.   |
| `policy/agents-tool-not-denied`                          | Een agent- of standaardconfiguratie weigert geen tool die door beleid vereist wordt. |
| `policy/tools-profile-unapproved`                        | Een geconfigureerd globaal of per-agent toolprofiel staat buiten de toelatingslijst. |
| `policy/tools-fs-workspace-only-required`                | Bestandssysteemtools zijn niet geconfigureerd met een padbeleid alleen voor de werkruimte. |
| `policy/tools-exec-security-unapproved`                  | Exec-beveiligingsmodus staat buiten de beleidstoelatingslijst.                    |
| `policy/tools-exec-ask-unapproved`                       | Exec-vraagmodus staat buiten de beleidstoelatingslijst.                           |
| `policy/tools-exec-host-unapproved`                      | Exec-hostroutering staat buiten de beleidstoelatingslijst.                        |
| `policy/tools-elevated-enabled`                          | Verhoogde toolmodus is ingeschakeld terwijl beleid dit weigert.                   |
| `policy/tools-also-allow-missing`                        | Een geconfigureerde `alsoAllow`-lijst mist een vermelding die door beleid vereist is. |
| `policy/tools-also-allow-unexpected`                     | Een geconfigureerde `alsoAllow`-lijst bevat een vermelding die niet door beleid wordt verwacht. |
| `policy/tools-required-deny-missing`                     | Een globale of per-agent toolweigerlijst bevat geen vereiste geweigerde tool.     |
| `policy/sandbox-mode-unapproved`                         | Sandboxmodus staat buiten de beleidstoelatingslijst.                              |
| `policy/sandbox-backend-unapproved`                      | Sandboxbackend staat buiten de beleidstoelatingslijst.                            |
| `policy/sandbox-container-posture-unobservable`          | Een containerhoudingsregel is ingeschakeld voor een backend die deze niet kan observeren. |
| `policy/sandbox-container-host-network-denied`           | Een containergebaseerde sandbox of browser gebruikt hostnetwerkmodus.             |
| `policy/sandbox-container-namespace-join-denied`         | Een containergebaseerde sandbox of browser sluit zich aan bij een andere containernamespace. |
| `policy/sandbox-container-mount-mode-required`           | Een containergebaseerde sandbox- of browsermount is niet alleen-lezen.            |
| `policy/sandbox-container-runtime-socket-mount`          | Een containergebaseerde sandbox- of browsermount stelt de containerruntime-socket bloot. |
| `policy/sandbox-container-unconfined-profile`            | Containersandboxprofiel is onbeperkt terwijl beleid dit weigert.                  |
| `policy/sandbox-browser-cdp-source-range-missing`        | Sandboxbrowser-CDP-bronbereik ontbreekt terwijl beleid er een vereist.            |
| `policy/data-handling-redaction-disabled`                | Redactie van gevoelige loggegevens is uitgeschakeld terwijl beleid dit vereist.   |
| `policy/data-handling-telemetry-content-capture`         | Vastlegging van telemetrie-inhoud is ingeschakeld terwijl beleid dit weigert.     |
| `policy/data-handling-session-retention-not-enforced`    | Onderhoud van sessiebewaring wordt niet afgedwongen terwijl beleid dit vereist.   |
| `policy/data-handling-session-transcript-memory-enabled` | Indexering van sessietranscriptgeheugen is ingeschakeld terwijl beleid dit weigert. |
| `policy/secrets-unmanaged-provider`                      | Een configuratie-SecretRef verwijst naar een provider die niet is gedeclareerd onder `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Een configuratiegeheimprovider of SecretRef gebruikt een bron die door beleid wordt geweigerd. |
| `policy/secrets-insecure-provider`                       | Een geheimprovider kiest voor een onveilige houding terwijl beleid dit weigert.   |
| `policy/auth-profile-invalid-metadata`                   | Een configuratie-authenticatieprofiel mist geldige provider- of modusmetadata.    |
| `policy/auth-profile-unapproved-mode`                    | Een configuratie-authenticatieprofielmodus staat buiten de beleidstoelatingslijst. |
| `policy/exec-approvals-missing`                          | Beleid vereist `exec-approvals.json`, maar het artefact ontbreekt.                |
| `policy/exec-approvals-invalid`                          | Het geconfigureerde exec-goedkeuringsartefact kan niet worden geparseerd.         |
| `policy/exec-approvals-default-security-unapproved`      | Exec-goedkeuringsstandaarden gebruiken een beveiligingsmodus buiten de beleidstoelatingslijst. |
| `policy/exec-approvals-agent-security-unapproved`        | Een effectieve exec-goedkeuringsbeveiligingsmodus per agent staat buiten de toelatingslijst. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Een exec-goedkeuringsagent staat impliciet automatisch skill-CLI's toe terwijl beleid dit weigert. |
| `policy/exec-approvals-allowlist-missing`                | De goedkeuringstoelatingslijst mist een patroon dat door beleid vereist is.       |
| `policy/exec-approvals-allowlist-unexpected`             | De goedkeuringstoelatingslijst bevat een patroon dat niet door beleid wordt verwacht. |
| `policy/tools-missing-risk-level`                        | Een beheerde tooldeclaratie mist risicometadata.                                  |
| `policy/tools-unknown-risk-level`                        | Een beheerde tooldeclaratie gebruikt een onbekende risicowaarde.                  |
| `policy/tools-missing-sensitivity-token`                 | Een beheerde tooldeclaratie mist gevoeligheidsmetadata.                           |
| `policy/tools-missing-owner`                             | Een beheerde tooldeclaratie mist eigenaarsmetadata.                               |
| `policy/tools-unknown-sensitivity-token`                 | Een beheerde tooldeclaratie gebruikt een onbekende gevoeligheidswaarde.           |

Beleidsbevindingen kunnen zowel `target` als `requirement` bevatten. `target` is het
waargenomen werkruimteobject dat niet voldoet. `requirement` is de geschreven
beleidsregel waardoor het een bevinding werd. Beide waarden zijn momenteel adressen,
meestal `oc://`-paden, maar de veldnamen beschrijven hun beleidsrol in plaats van de
adresindeling.

Voorbeeld-JSON-bevinding:

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

Voorbeeld-toolbevinding:

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

Voorbeeld-MCP-bevinding:

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

Voorbeeld-modelproviderbevinding:

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

Voorbeeld-netwerkbevinding:

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

Voorbeeldbevinding voor Gateway-blootstelling:

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

Voorbeeldbevinding voor agentwerkruimte:

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

## Herstel

`doctor --lint` en `policy check` zijn alleen-lezen.

`doctor --fix` bewerkt alleen door beleid beheerde werkruimte-instellingen wanneer
`workspaceRepairs` expliciet is ingeschakeld. Zonder die opt-in melden beleidscontroles
wat ze zouden repareren en laten ze instellingen ongewijzigd.

In deze versie kan reparatie kanalen uitschakelen die in de OpenClaw-configuratie zijn ingeschakeld
maar door `channels.denyRules` worden geweigerd. Schakel `workspaceRepairs` pas in nadat het
beleidsbestand is beoordeeld, omdat een geldige weigerregel een
geconfigureerd kanaal kan uitschakelen:

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

| Opdracht         | `0`                                                            | `1`                                                                      | `2`                          |
| ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------- |
| `policy check`   | Geen bevindingen op de drempel.                                | Een of meer bevindingen voldeden aan de drempel.                         | Argument- of runtimefout.    |
| `policy compare` | Het beleidsbestand is minstens zo strikt als de baseline.      | Het beleidsbestand is ongeldig, ontbreekt of is zwakker dan baseline-regels. | Argument- of runtimefout. |
| `policy watch`   | Geen bevindingen en geaccepteerde hash is actueel.             | Er bestaan bevindingen of de geaccepteerde attestatie is verouderd.       | Argument- of runtimefout.    |

## Gerelateerd

- [Doctor-lintmodus](/nl/cli/doctor#lint-mode)
- [Path-CLI](/nl/cli/path)
