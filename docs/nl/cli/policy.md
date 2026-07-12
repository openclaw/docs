---
read_when:
    - Je wilt de OpenClaw-instellingen controleren aan de hand van een opgestelde policy.jsonc
    - U wilt beleidsbevindingen in de doctor-lintcontrole
    - U hebt een hash van de beleidsverklaring nodig als auditbewijs
summary: CLI-referentie voor `openclaw policy`-conformiteitscontroles
title: Beleid
x-i18n:
    generated_at: "2026-07-12T08:44:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` wordt geleverd door de gebundelde Policy-plugin. Het is een
conformiteitslaag voor ondernemingen boven op bestaande OpenClaw-instellingen,
geen tweede configuratiesysteem. U legt vereisten vast in `policy.jsonc`;
OpenClaw observeert de actieve werkruimte als bewijs; Policy meldt afwijkingen
via `doctor --lint`. Policy dwingt geen toolaanroepen af en herschrijft het
runtimegedrag niet tijdens een aanvraag. Ook attesteert Policy geen
referentieopslagen per agent, zoals `auth-profiles.json`.

Policy controleert geconfigureerde kanalen, MCP-servers, modelproviders, de
netwerkhouding voor SSRF, toegang via inkomende verbindingen en kanalen,
blootstelling van de Gateway en de houding voor Node-opdrachten, toegang tot
agentwerkruimten, de sandboxhouding, de gegevensverwerkingshouding, de houding
van geheimenproviders en authenticatieprofielen, en beheerde toolmetagegevens
(`TOOLS.md`). Gebruik dit wanneer een werkruimte een duurzame, controleerbare
verklaring nodig heeft, zoals "Telegram mag niet zijn ingeschakeld" of
"beheerde tools moeten metagegevens over risico en eigenaar declareren". Als u
alleen lokaal gedrag nodig hebt zonder attestatie of afwijkingsdetectie, is
gewone configuratie voldoende.

## Snel aan de slag

```bash
openclaw plugins enable policy
```

De Plugin blijft ingeschakeld, zelfs wanneer `policy.jsonc` ontbreekt, zodat
doctor het ontbrekende artefact kan melden in plaats van controles stilzwijgend
over te slaan.

Stel `policy.jsonc` handmatig op; het wordt niet gegenereerd uit de huidige
instellingen. Elke sectie op het hoogste niveau is een naamruimte voor regels:
een controle wordt alleen uitgevoerd wanneer er een concrete regel in staat
(niet-ondersteunde secties of sleutels mislukken met
`policy/policy-jsonc-invalid` in plaats van stilzwijgend te worden genegeerd).
Minimaal voorbeeld dat elke ondersteunde sectie omvat:

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

Overkoepelende opmerkingen die niet duidelijk blijken uit de onderstaande
regeltabellen:

- Als u `gateway.bind` weglaat terwijl u niet-loopbackbindingen weigert,
  accepteert u de standaardwaarde van de runtime; stel
  `gateway.bind: "loopback"` in voor strikte conformiteit.
- Stel voor een alleen-lezenagent de sandbox-`mode` in op `all` of `non-main`
  bij de toepasselijke standaardwaarden of agent en stel `workspaceAccess` in
  op `none` of `ro`. Een ontbrekende sandboxmodus of de modus `off` voldoet
  niet aan beleid voor alleen-lezengebruik.
- `agents.workspace.denyTools` accepteert `exec`, `process`, `write`, `edit`,
  `apply_patch`. De groepen voor het weigeren van configuratietools `group:fs`
  (bestandswijziging) en `group:runtime` (shell/proces) voldoen aan de
  gelijkwaardige houding.
- Controles voor uitvoeringsgoedkeuringen lezen het actieve artefact
  `exec-approvals.json` alleen wanneer een `execApprovals`-regel aanwezig is;
  een ontbrekend of ongeldig artefact is niet-observeerbaar bewijs, geen
  kunstmatig geslaagde controle.
- Bewijs voor geheimen en authenticatieprofielen registreert alleen de houding
  van providers/bronnen en SecretRef-metagegevens, nooit onbewerkte waarden.
  Policy leest of attesteert geen referentieopslagen per agent, zoals
  `auth-profiles.json`.
- Bewijs voor gegevensverwerking betreft alleen de houding op
  configuratieniveau (redactiemodus, schakelaar voor telemetrieverzameling,
  modus voor sessieonderhoud en instelling voor transcriptindexering). Het
  inspecteert geen logboeken, telemetrie-exports, transcripten of
  geheugenbestanden. Een schoon resultaat bewijst niet dat deze geen
  persoonsgegevens of geheimen bevatten.

### Naslag voor Policy-regels

Elke onderstaande regel is optioneel; een controle wordt alleen uitgevoerd
wanneer de regel aanwezig is. De geobserveerde status bestaat uit de bestaande
OpenClaw-configuratie of werkruimtemetagegevens.

#### Bereikgebonden overlays

Gebruik `scopes.<scopeName>` wanneer specifieke agents of kanalen strenger
beleid nodig hebben dan de basislijn op het hoogste niveau. De bereiknaam is
slechts een label; de overeenkomst gebruikt de selector binnen het bereik.
Overlays zijn additief: de globale regel blijft actief en de bereikgebonden
regel kan een eigen bevinding toevoegen voor hetzelfde bewijs.

| Selector     | Ondersteunde secties                                                            | Gebruiken wanneer                                      |
| ------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Eén of meer runtimeagents strengere regels nodig hebben. |
| `channelIds` | `ingress.channels`                                                             | Eén of meer kanalen strengere regels voor inkomende toegang nodig hebben. |

Als een `agentIds`-vermelding niet aanwezig is in `agents.list[]`, evalueert
OpenClaw de bereikgebonden regel aan de hand van de overgenomen globale of
standaardhouding voor die runtimeagent-id, in plaats van deze over te slaan.

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

Dezelfde agent kan in meerdere bereiken voorkomen als elk bereik een ander
veld beheert, zoals hierboven. Een herhaald bereikgebonden veld voor dezelfde
agent moet even streng of strenger zijn; een zwakkere dubbele claim wordt
afgewezen (toestemmingslijsten zijn deelverzamelingen, weigeringslijsten zijn
superverzamelingen en vereiste booleaanse waarden staan vast).

Regels voor de containerhouding (`sandbox.containers.*`) worden alleen
gecontroleerd aan de hand van bewijs dat de sandboxbackend van de
overeenkomende agent beschikbaar kan maken. Als een backend een regel die u
ervoor hebt ingeschakeld niet kan observeren, meldt Policy
`policy/sandbox-container-posture-unobservable` in plaats van de controle te
laten slagen; beperk containerregels tot de agentgroepen die een backend
gebruiken welke deze beschikbaar kan maken.

`ingress.session.requireDmScope` op het hoogste niveau blijft globaal;
`session.dmScope` is geen bewijs dat aan een kanaal kan worden toegeschreven en
kan daarom niet via `channelIds` tot een bereik worden beperkt.

Elk bereik in `policy.jsonc` moet geldig en afdwingbaar zijn.

#### Kanalen

| Beleidsveld                          | Geobserveerde status                        | Gebruiken wanneer                                                   |
| ------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Provider en ingeschakelde status van `channels.*` | Geconfigureerde kanalen van een provider zoals `telegram` weigeren. |
| `channels.denyRules[].reason`        | Context voor bevindingsbericht en herstelhint | Uitleggen waarom de provider wordt geweigerd.                       |

#### MCP-servers

| Beleidsveld         | Geobserveerde status | Gebruiken wanneer                                                       |
| ------------------- | -------------------- | ----------------------------------------------------------------------- |
| `mcp.servers.allow` | Id's van `mcp.servers.*` | Vereisen dat elke geconfigureerde MCP-server in een toestemmingslijst staat. |
| `mcp.servers.deny`  | Id's van `mcp.servers.*` | Specifieke geconfigureerde MCP-server-id's weigeren.                    |

#### Modelproviders

| Beleidsveld              | Geobserveerde status                                      | Gebruiken wanneer                                                                             |
| ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `models.providers.allow` | Id's van `models.providers.*` en geselecteerde modelreferenties | Vereisen dat geconfigureerde providers en geselecteerde modelreferenties goedgekeurde providers gebruiken. |
| `models.providers.deny`  | Id's van `models.providers.*` en geselecteerde modelreferenties | Geconfigureerde providers en geselecteerde modelreferenties op provider-id weigeren.          |

#### Netwerk

| Beleidsveld                    | Geobserveerde status                           | Gebruiken wanneer                                                        |
| ------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `network.privateNetwork.allow` | Omwegen voor SSRF naar het privénetwerk        | Instellen op `false` om te vereisen dat toegang tot het privénetwerk uitgeschakeld blijft. |

#### Inkomende toegang en kanaaltoegang

| Beleidsveld                              | Waargenomen status                                                 | Gebruiken wanneer                                                           |
| ----------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                                  | Een beoordeeld isolatiebereik voor directe berichten vereist is.            |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` en verouderde DM-beleidsvelden voor kanalen  | Alleen beoordeeld kanaalbeleid voor directe berichten is toegestaan.        |
| `ingress.channels.denyOpenGroups`         | Ingressbeleid voor kanalen, accounts en groepen                    | Open groepsingress voor geconfigureerde kanalen en accounts moet worden geweigerd. |
| `ingress.channels.requireMentionInGroups` | Configuratie voor vermeldingspoorten op kanaal-, account-, groeps-, server- en genest niveau | Vermeldingspoorten vereist zijn wanneer groepsingress open is of een vermelding vereist. |

#### Gateway

| Beleidsveld                            | Waargenomen status                                     | Gebruiken wanneer                                                                             |
| -------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                        | Instellen op `false` om binding van de Gateway aan local loopback te vereisen.                 |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel-houding van de Gateway         | Instellen op `false` om blootstelling via Tailscale Funnel te weigeren.                        |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                                   | Instellen op `true` om uitgeschakelde Gateway-authenticatie te weigeren.                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                              | Instellen op `true` om expliciete configuratie voor snelheidsbeperking van authenticatie te vereisen. |
| `gateway.controlUi.allowInsecure`       | Onveilige schakelaars voor authenticatie, apparaten en oorsprongen in de bedieningsinterface | Instellen op `false` om onveilige schakelaars voor blootstelling van de bedieningsinterface te weigeren. |
| `gateway.remote.allow`                  | Externe Gateway-modus/-configuratie                   | Instellen op `false` om de externe Gateway-modus te weigeren.                                 |
| `gateway.http.denyEndpoints`            | HTTP-API-eindpunten van de Gateway                    | Eindpunt-id's zoals `chatCompletions` of `responses` weigeren.                                 |
| `gateway.http.requireUrlAllowlists`      | URL-ophaalinvoer van de HTTP-API van de Gateway       | Instellen op `true` om URL-toestaanlijsten voor URL-ophaalinvoer te vereisen.                  |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                          | Vereisen dat exacte Node-opdracht-id's zoals `system.run` in de OpenClaw-configuratie worden geweigerd. |

`gateway.nodes.denyCommands` is een exacte, hoofdlettergevoelige regel waarbij
de weigerlijst een bovenverzameling moet zijn. Gebruik deze wanneer het beleid
moet aantonen dat bevoorrechte Node-opdrachten expliciet door de
OpenClaw-configuratie worden geweigerd. Voor een implementatie die opzettelijk
een bevoorrechte Node-opdracht toestaat, moet `policy.jsonc` na beoordeling
worden bijgewerkt in plaats van uitsluitend op `gateway.nodes.allowCommands`
te vertrouwen.

#### Agentwerkruimte

| Beleidsveld                     | Waargenomen status                                                                        | Gebruiken wanneer                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` en `agents.list[].sandbox.workspaceAccess`     | Alleen waarden voor sandboxwerkruimtetoegang zoals `none` of `ro` zijn toegestaan.                |
| `agents.workspace.denyTools`     | Algemene en agentspecifieke configuratie voor het weigeren van hulpmiddelen              | Vereisen dat wijzigingshulpmiddelen (`exec`, `process`, `write`, `edit`, `apply_patch`) worden geweigerd. |

#### Sandboxhouding

| Beleidsveld                                          | Waargenomen status                                          | Gebruiken wanneer                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` en agentspecifieke modus     | Alleen beoordeelde sandboxmodi zoals `all` of `non-main` zijn toegestaan. |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` en agentspecifieke backend | Alleen beoordeelde sandboxbackends zoals `docker` zijn toegestaan.      |
| `sandbox.containers.denyHostNetwork`                 | Netwerkmodus van containergebaseerde sandbox/browser        | Hostnetwerkmodus moet worden geweigerd.                                  |
| `sandbox.containers.denyContainerNamespaceJoin`      | Netwerkmodus van containergebaseerde sandbox/browser        | Deelname aan de netwerknaamruimte van een andere container moet worden geweigerd. |
| `sandbox.containers.requireReadOnlyMounts`           | Koppelmodus van containergebaseerde sandbox/browser         | Koppelingen moeten alleen-lezen zijn.                                    |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Koppeldoelen van containergebaseerde sandbox/browser       | Koppelingen van sockets van de containerruntime moeten worden geweigerd. |
| `sandbox.containers.denyUnconfinedProfiles`          | Houding voor containerbeveiligingsprofielen                 | Onbeperkte containerbeveiligingsprofielen moeten worden geweigerd.       |
| `sandbox.browser.requireCdpSourceRange`              | CDP-bronbereik van de sandboxbrowser                        | Voor blootstelling van browser-CDP moet een bronbereik worden opgegeven. |

Het beleid behandelt een ontbrekende `sandbox.mode` als de impliciete
standaardwaarde `off`. Daardoor rapporteert `sandbox.requireMode` een nieuwe of
niet-geconfigureerde sandbox als buiten een toestaanlijst zoals `["all"]`.

#### Gegevensverwerking

| Beleidsveld                                        | Waargenomen status                                                                       | Gebruiken wanneer                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`   | `logging.redactSensitive`                                                               | Instellen op `true` om `logging.redactSensitive: "off"` te weigeren.            |
| `dataHandling.telemetry.denyContentCapture`        | `diagnostics.otel.captureContent`                                                       | Instellen op `true` om het vastleggen van inhoud door telemetrie te weigeren.   |
| `dataHandling.retention.requireSessionMaintenance` | `session.maintenance.mode`                                                              | Instellen op `true` om de effectieve sessieonderhoudsmodus `enforce` te vereisen. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` en `agents.*.memorySearch.experimental.sessionMemory`    | Instellen op `true` om indexering van sessietranscripten in het geheugen te weigeren. |

#### Geheimen

| Beleidsveld                      | Waargenomen status                                           | Gebruiken wanneer                                                                |
| -------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs in de configuratie en declaraties van `secrets.providers.*` | Instellen op `true` om te vereisen dat SecretRefs naar gedeclareerde providers verwijzen. |
| `secrets.denySources`             | Bronnen van geheimproviders en SecretRef-bronnen             | Bronnen zoals `exec`, `file` of een andere geconfigureerde bronnaam weigeren.    |
| `secrets.allowInsecureProviders`  | Houdingsvlaggen voor onveilige geheimproviders               | Instellen op `false` om providers te weigeren die voor een onveilige houding kiezen. |

#### Exec-goedkeuringen

Controles voor exec-goedkeuringen lezen het runtime-artefact
`exec-approvals.json`: standaard `~/.openclaw/exec-approvals.json`, of
`$OPENCLAW_STATE_DIR/exec-approvals.json` wanneer `OPENCLAW_STATE_DIR` is
ingesteld. Houdingsregels onder `execApprovals.defaults.*` of
`execApprovals.agents.*` vereisen leesbaar bewijs uit het artefact; een
ontbrekend of ongeldig artefact wordt gerapporteerd als niet-waarneembaar
bewijs en niet als een best-effortgoedkeuring. Zodra het artefact leesbaar is,
nemen weggelaten velden de runtime-standaardwaarden over: ontbrekende
`defaults.security` is `full` en ontbrekende agentbeveiliging neemt die
standaardwaarde over. Het bewijs omvat `defaults`, `agents.*`,
`agents.*.allowlist[].pattern`, optioneel `argPattern`, de effectieve houding
voor `autoAllowSkills` en de bron van de vermelding — nooit het socketpad/token,
`commandText`, `lastUsedCommand`, opgeloste paden of tijdstempels.

| Beleidsveld                                | Waargenomen status                                                                         | Gebruiken wanneer                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `execApprovals.requireFile`                | Actief runtimepad naar `exec-approvals.json`                                               | Instellen op `true` om te vereisen dat het goedkeuringsartefact bestaat en kan worden geparseerd. |
| `execApprovals.defaults.allowSecurity`     | `defaults.security`, standaard `full`                                                      | Alleen goedgekeurde standaardbeveiligingsmodi voor goedkeuringen zijn toegestaan.                 |
| `execApprovals.agents.allowSecurity`       | `agents.*.security`, waarbij standaardwaarden worden overgenomen                           | Alleen goedgekeurde effectieve agentspecifieke beveiligingsmodi voor goedkeuringen zijn toegestaan. |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` en `agents.*.autoAllowSkills`, waarbij runtime-standaardwaarden worden overgenomen | Instellen op `false` om strikte handmatige toestaanlijsten zonder impliciete CLI-goedkeuring voor Skills te vereisen. |
| `execApprovals.agents.allowlist.expected`  | Geaggregeerde `agents.*.allowlist[]`-patronen en optionele argPattern-vermeldingen          | Vereisen dat de toestaanlijst voor goedkeuringen overeenkomt met de beoordeelde patronenset.       |

Voorbeeld: vereis het goedkeuringsartefact, weiger permissieve
standaardwaarden en sta voor geselecteerde agents alleen een beoordeelde
houding voor exec-goedkeuringen toe.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Beveiligingsmodi: "deny", "allowlist" of "full".
      // Deze standaardinstelling staat alleen de strikt vergrendelde deny-houding toe.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Geselecteerde agents mogen een beoordeelde allowlist-houding gebruiken, maar niet "full".
          "allowSecurity": ["allowlist"],
          // false betekent dat CLI's van Skills in de beoordeelde allowlist moeten staan in plaats van
          // impliciet te worden goedgekeurd door autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Eenvoudige vermelding: exact beoordeeld uitvoerbaar patroon zonder argPattern.
              "travel-hub",
              // Beperkte vermelding: patroon plus beoordeelde reguliere expressie voor argumenten.
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

#### Authenticatieprofielen

| Beleidsveld                     | Waargenomen status                            | Gebruiken wanneer                                                                                      |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | provider- en modusmetadata van `auth.profiles.*` | Metadatasleutels zoals `provider` en `mode` verplicht stellen voor authenticatieprofielen in de configuratie. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                        | Alleen ondersteunde modi voor authenticatieprofielen toestaan, zoals `api_key`, `aws-sdk`, `oauth` of `token`. |

#### Toolmetadata

| Beleidsveld             | Waargenomen status                 | Gebruiken wanneer                                                                                      |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Beheerde declaraties in `TOOLS.md` | Vereisen dat beheerde tools metadatasleutels declareren, zoals `risk`, `sensitivity` of `owner`.       |

#### Toolhouding

| Beleidsveld                     | Waargenomen status                                         | Gebruiken wanneer                                                                                                      |
| ------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` en `agents.list[].tools.profile`           | Alleen toolprofiel-id's toestaan, zoals `minimal`, `messaging` of `coding`.                                             |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` en `tools.fs`-overschrijvingen per agent | Instellen op `true` om te vereisen dat bestandssysteemtools alleen binnen de werkruimte werken.                        |
| `tools.exec.allowSecurity`      | `tools.exec.security` en uitvoeringsbeveiliging per agent  | Alleen beveiligingsmodi voor uitvoering toestaan, zoals `deny` of `allowlist`.                                         |
| `tools.exec.requireAsk`         | `tools.exec.ask` en vraagmodus voor uitvoering per agent   | Een goedkeuringshouding vereisen, zoals `always`.                                                                      |
| `tools.exec.allowHosts`         | `tools.exec.host` en hostroutering voor uitvoering per agent | Alleen hostrouteringsmodi voor uitvoering toestaan, zoals `sandbox`.                                                   |
| `tools.elevated.allow`          | `tools.elevated.enabled` en verhoogde houding per agent    | Instellen op `false` om te vereisen dat de verhoogde toolmodus uitgeschakeld blijft.                                   |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` en `tools.alsoAllow` per agent           | Exacte `alsoAllow`-vermeldingen vereisen en ontbrekende of onverwachte aanvullende tooltoekenningen rapporteren.       |
| `tools.denyTools`               | `tools.deny` en `agents.list[].tools.deny`                 | Vereisen dat geconfigureerde weigerlijsten voor tools tool-id's of groepen bevatten, zoals `group:runtime` en `group:fs`. |

## Controles uitvoeren

Voer tijdens het opstellen alleen beleidscontroles uit:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` voert alleen de verzameling beleidscontroles uit en geeft bewijsmateriaal, bevindingen
en attestatiehashes weer. Dezelfde bevindingen verschijnen ook in
`openclaw doctor --lint` wanneer de Policy-plugin is ingeschakeld.

Vergelijk een beleidsbestand van een beheerder met een opgestelde basislijn:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` controleert de syntaxis van een beleidsbestand ten opzichte van de syntaxis van een beleidsbestand; het
inspecteert geen runtimestatus, bewijsmateriaal, aanmeldgegevens of geheimen. Het gebruikt dezelfde
regelmetadata die beheerde overschrijvingen per bereik regelt: allowlists moeten gelijk of
beperkter blijven, denylists moeten gelijk of ruimer blijven, verplichte booleaanse waarden moeten
hun waarde behouden, geordende tekenreeksen mogen alleen naar het strengere einde van de
geconfigureerde volgorde verschuiven en exacte lijsten moeten overeenkomen. De basislijn kan een
door een organisatie opgesteld beleid zijn; het gecontroleerde beleid mag strengere waarden of
extra regels toevoegen. Een gecontroleerde regel op het hoogste niveau kan voldoen aan een regel met bereik in de basislijn wanneer
deze even restrictief of restrictiever is. Bereiknamen hoeven tussen
bestanden niet overeen te komen; vergelijking gebeurt op selector (`agentIds`/`channelIds`) en veld.

Schone vergelijking (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Schone uitvoer van `policy check --json` bevat stabiele hashes die een beheerder of
toezichthouder kan vastleggen:

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

De beleidsconfiguratie staat onder `plugins.entries.policy.config`.

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

| Instelling                  | Doel                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| `enabled`                  | Beleidscontroles inschakelen, zelfs voordat `policy.jsonc` bestaat.   |
| `workspaceRepairs`         | Toestaan dat `doctor --fix` door beleid beheerde werkruimte-instellingen bewerkt. |
| `expectedHash`             | Optionele hashvergrendeling voor het goedgekeurde beleidsartefact.    |
| `expectedAttestationHash`  | Optionele hashvergrendeling voor de laatst geaccepteerde schone beleidscontrole. |
| `path`                     | Locatie van het beleidsartefact ten opzichte van de werkruimte.       |

Stel `plugins.entries.policy.config.enabled` in op `false` om beleidscontroles
voor een werkruimte uit te schakelen terwijl de plugin geïnstalleerd blijft.

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

`attestation.policy.hash` identificeert het opgestelde regelartefact. `evidence`
legt de waargenomen OpenClaw-status vast die door de controles is gebruikt, en
`workspace.hash` identificeert die bewijslast. `findingsHash` identificeert
de exacte verzameling bevindingen. `checkedAt` legt vast wanneer de controle is uitgevoerd.
`attestationHash` identificeert de stabiele verklaring (beleidshash, bewijshash,
bevindingenhash en schone/vervuilde status) en sluit `checkedAt` bewust uit,
zodat dezelfde beleidsstatus altijd dezelfde attestatiehash oplevert. Samen
vormen deze vier waarden de audittuple voor één beleidscontrole.

Als een Gateway of toezichthouder beleid gebruikt om een runtimeactie te blokkeren, goed te keuren of van een annotatie te voorzien,
moet deze de attestatiehash van de laatste schone
controle vastleggen. `checkedAt` blijft voor auditlogboeken in de JSON-uitvoer staan, maar maakt geen deel uit van de
stabiele hash.

Levenscyclus voor het accepteren van de beleidsstatus:

1. Stel `policy.jsonc` op of beoordeel het.
2. Voer `openclaw policy check --json` uit.
3. Leg bij een schone controle `attestation.policy.hash` vast als `expectedHash`.
4. Leg `attestation.attestationHash` vast als `expectedAttestationHash`.
5. Voer `openclaw doctor --lint` opnieuw uit in CI- of releasepoorten.

Als beleidsregels bewust worden gewijzigd, werk dan beide geaccepteerde hashes bij op basis van een
schone controle. Als alleen werkruimte-instellingen worden gewijzigd (het beleid blijft hetzelfde),
verandert doorgaans alleen `expectedAttestationHash`.

Als u regels voor `agents.workspace` inschakelt of bijwerkt, wordt `agentWorkspace`-bewijs
toegevoegd aan de werkruimtehash en attestatiehash; beoordeel het nieuwe bewijs en
vernieuw de geaccepteerde attestatiehashes na het inschakelen. Als u regels voor
de toolpostuur inschakelt of bijwerkt, wordt op dezelfde manier `toolPosture`-bewijs toegevoegd.

`openclaw policy watch` voert de controle opnieuw uit en meldt wanneer het huidige bewijs niet
meer overeenkomt met `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Gebruik `--once` in CI of scripts die één driftbeoordeling nodig hebben. Zonder
`--once` wordt standaard elke twee seconden gecontroleerd; gebruik `--interval-ms` om
het interval te wijzigen.

## Bevindingen

| Controle-id                                              | Bevinding                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Beleid is ingeschakeld, maar `policy.jsonc` ontbreekt.                             |
| `policy/policy-jsonc-invalid`                            | Beleid kan niet worden geparseerd of bevat onjuist gevormde regelvermeldingen.     |
| `policy/policy-hash-mismatch`                            | Beleid komt niet overeen met de geconfigureerde `expectedHash`.                   |
| `policy/attestation-hash-mismatch`                       | Huidig beleidsbewijs komt niet meer overeen met de geaccepteerde attestatie.       |
| `policy/policy-conformance-invalid`                      | Een basislijn of gecontroleerd beleidsbestand bevat ongeldige vergelijkingssyntaxis. |
| `policy/policy-conformance-missing`                      | Een gecontroleerd beleidsbestand mist een regel die door het basislijnbeleidsbestand wordt vereist. |
| `policy/policy-conformance-weaker`                       | Een gecontroleerd beleidsbestand heeft een zwakkere waarde dan het basislijnbeleidsbestand. |
| `policy/channels-denied-provider`                        | Een ingeschakeld kanaal komt overeen met een weigeringsregel voor kanalen.         |
| `policy/mcp-denied-server`                               | Een geconfigureerde MCP-server wordt door het beleid geweigerd.                    |
| `policy/mcp-unapproved-server`                           | Een geconfigureerde MCP-server valt buiten de toelatingslijst.                    |
| `policy/models-denied-provider`                          | Een geconfigureerde modelprovider of modelverwijzing gebruikt een geweigerde provider. |
| `policy/models-unapproved-provider`                      | Een geconfigureerde modelprovider of modelverwijzing valt buiten de toelatingslijst. |
| `policy/network-private-access-enabled`                  | Een SSRF-uitwijkmogelijkheid voor privénetwerken is ingeschakeld terwijl het beleid deze weigert. |
| `policy/ingress-dm-policy-unapproved`                    | Het DM-beleid van een kanaal valt buiten de toelatingslijst van het beleid.        |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` komt niet overeen met het door het beleid vereiste DM-isolatiebereik. |
| `policy/ingress-open-groups-denied`                      | Het groepsbeleid van een kanaal is `open`, terwijl het beleid open groepsingang weigert. |
| `policy/ingress-group-mention-required`                  | Een kanaal- of groepsvermelding schakelt vermeldingspoorten uit terwijl het beleid deze vereist. |
| `policy/gateway-non-loopback-bind`                       | De bindingspostuur van de Gateway staat blootstelling buiten local loopback toe terwijl het beleid deze weigert. |
| `policy/gateway-auth-disabled`                           | Gateway-authenticatie is uitgeschakeld terwijl het beleid authenticatie vereist.  |
| `policy/gateway-rate-limit-missing`                      | De snelheidslimietpostuur voor Gateway-authenticatie is niet expliciet terwijl het beleid dit vereist. |
| `policy/gateway-control-ui-insecure`                     | Schakelaars voor onveilige blootstelling van de Gateway-bedieningsinterface zijn ingeschakeld. |
| `policy/gateway-tailscale-funnel`                        | Blootstelling via Gateway Tailscale Funnel is ingeschakeld terwijl het beleid deze weigert. |
| `policy/gateway-remote-enabled`                          | De externe modus van de Gateway is actief terwijl het beleid deze weigert.        |
| `policy/gateway-http-endpoint-enabled`                   | Een HTTP-API-eindpunt van de Gateway is ingeschakeld terwijl het door het beleid wordt geweigerd. |
| `policy/gateway-http-url-fetch-unrestricted`             | Invoer voor het ophalen van URL's via Gateway HTTP mist een vereiste URL-toelatingslijst. |
| `policy/gateway-node-command-denied`                     | Een door het beleid geweigerd Node-commando wordt niet door de OpenClaw-configuratie geweigerd. |
| `policy/agents-workspace-access-denied`                  | De sandboxmodus of werkruimtetoegang van de agent valt buiten de toelatingslijst van het beleid. |
| `policy/agents-tool-not-denied`                          | Een agent- of standaardconfiguratie weigert een door het beleid verplicht te weigeren tool niet. |
| `policy/tools-profile-unapproved`                        | Een geconfigureerd algemeen of agentspecifiek toolprofiel valt buiten de toelatingslijst. |
| `policy/tools-fs-workspace-only-required`                | Bestandssysteemtools zijn niet geconfigureerd met een padpostuur die uitsluitend de werkruimte toestaat. |
| `policy/tools-exec-security-unapproved`                  | De beveiligingsmodus voor uitvoering valt buiten de toelatingslijst van het beleid. |
| `policy/tools-exec-ask-unapproved`                       | De vraagmodus voor uitvoering valt buiten de toelatingslijst van het beleid.      |
| `policy/tools-exec-host-unapproved`                      | De hostroutering voor uitvoering valt buiten de toelatingslijst van het beleid.   |
| `policy/tools-elevated-enabled`                          | De toolmodus met verhoogde bevoegdheden is ingeschakeld terwijl het beleid deze weigert. |
| `policy/tools-also-allow-missing`                        | Een geconfigureerde `alsoAllow`-lijst mist een door het beleid vereiste vermelding. |
| `policy/tools-also-allow-unexpected`                     | Een geconfigureerde `alsoAllow`-lijst bevat een vermelding die niet door het beleid wordt verwacht. |
| `policy/tools-required-deny-missing`                     | Een algemene of agentspecifieke weigeringslijst voor tools bevat een verplicht te weigeren tool niet. |
| `policy/sandbox-mode-unapproved`                         | De sandboxmodus valt buiten de toelatingslijst van het beleid.                    |
| `policy/sandbox-backend-unapproved`                      | De sandboxbackend valt buiten de toelatingslijst van het beleid.                  |
| `policy/sandbox-container-posture-unobservable`          | Een containerpostuurregel is ingeschakeld voor een backend die deze niet kan waarnemen. |
| `policy/sandbox-container-host-network-denied`           | Een containergebaseerde sandbox of browser gebruikt de hostnetwerkmodus.          |
| `policy/sandbox-container-namespace-join-denied`         | Een containergebaseerde sandbox of browser treedt toe tot de naamruimte van een andere container. |
| `policy/sandbox-container-mount-mode-required`           | Een koppeling van een containergebaseerde sandbox of browser is niet alleen-lezen. |
| `policy/sandbox-container-runtime-socket-mount`          | Een koppeling van een containergebaseerde sandbox of browser stelt de socket van de containerruntime bloot. |
| `policy/sandbox-container-unconfined-profile`            | Het containersandboxprofiel is onbeperkt terwijl het beleid dit weigert.          |
| `policy/sandbox-browser-cdp-source-range-missing`        | Het CDP-bronbereik van de sandboxbrowser ontbreekt terwijl het beleid er een vereist. |
| `policy/data-handling-redaction-disabled`                | Redactie van gevoelige loggegevens is uitgeschakeld terwijl het beleid deze vereist. |
| `policy/data-handling-telemetry-content-capture`         | Vastlegging van telemetrie-inhoud is ingeschakeld terwijl het beleid deze weigert. |
| `policy/data-handling-session-retention-not-enforced`    | Onderhoud van sessiebewaring wordt niet afgedwongen terwijl het beleid dit vereist. |
| `policy/data-handling-session-transcript-memory-enabled` | Geheugenindexering van sessietranscripten is ingeschakeld terwijl het beleid deze weigert. |
| `policy/secrets-unmanaged-provider`                      | Een SecretRef in de configuratie verwijst naar een provider die niet onder `secrets.providers` is gedeclareerd. |
| `policy/secrets-denied-provider-source`                  | Een geheimprovider of SecretRef in de configuratie gebruikt een door het beleid geweigerde bron. |
| `policy/secrets-insecure-provider`                       | Een geheimprovider kiest voor een onveilige postuur terwijl het beleid deze weigert. |
| `policy/auth-profile-invalid-metadata`                   | Een authenticatieprofiel in de configuratie mist geldige metadata voor provider of modus. |
| `policy/auth-profile-unapproved-mode`                    | De modus van een authenticatieprofiel in de configuratie valt buiten de toelatingslijst van het beleid. |
| `policy/exec-approvals-missing`                          | Het beleid vereist `exec-approvals.json`, maar het artefact ontbreekt.             |
| `policy/exec-approvals-invalid`                          | Het geconfigureerde artefact voor uitvoeringsgoedkeuringen kan niet worden geparseerd. |
| `policy/exec-approvals-default-security-unapproved`      | De standaardwaarden voor uitvoeringsgoedkeuringen gebruiken een beveiligingsmodus buiten de toelatingslijst van het beleid. |
| `policy/exec-approvals-agent-security-unapproved`        | Een effectieve beveiligingsmodus voor agentspecifieke uitvoeringsgoedkeuringen valt buiten de toelatingslijst. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Een agent voor uitvoeringsgoedkeuringen staat Skills-CLI's impliciet automatisch toe terwijl het beleid dit weigert. |
| `policy/exec-approvals-allowlist-missing`                | De toelatingslijst voor goedkeuringen mist een door het beleid vereist patroon.    |
| `policy/exec-approvals-allowlist-unexpected`             | De toelatingslijst voor goedkeuringen bevat een patroon dat niet door het beleid wordt verwacht. |
| `policy/tools-missing-risk-level`                        | Een gereguleerde tooldeclaratie mist risicometadata.                              |
| `policy/tools-unknown-risk-level`                        | Een gereguleerde tooldeclaratie gebruikt een onbekende risicowaarde.              |
| `policy/tools-missing-sensitivity-token`                 | Een gereguleerde tooldeclaratie mist gevoeligheidsmetadata.                       |
| `policy/tools-missing-owner`                             | Een gereguleerde tooldeclaratie mist eigenaarsmetadata.                           |
| `policy/tools-unknown-sensitivity-token`                 | Een gereguleerde tooldeclaratie gebruikt een onbekende gevoeligheidswaarde.       |

Een bevinding kan zowel `target` (het waargenomen werkruimteonderdeel dat niet
voldoet) als `requirement` (de opgestelde regel waardoor het een bevinding werd)
bevatten. Beide zijn momenteel `oc://`-adresreeksen, maar de veldnamen beschrijven de
beleidsrol en niet de adresindeling.

Voorbeelden van bevindingen:

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

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP-server 'remote' staat niet op de acceptatielijst van het beleid.",
  "source": "policy",
  "path": "openclaw-configuratie",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Modelverwijzing 'anthropic/claude-sonnet-4.7' gebruikt de niet-goedgekeurde provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw-configuratie",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Netwerkinstelling 'browser-private-network' staat toegang tot het privénetwerk toe.",
  "source": "policy",
  "path": "openclaw-configuratie",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway-bindingsinstelling 'gateway-bind' staat blootstelling buiten local loopback toe.",
  "source": "policy",
  "path": "openclaw-configuratie",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway-nodeopdracht 'system.run' wordt door het beleid geweigerd, maar niet door de OpenClaw-configuratie.",
  "source": "policy",
  "path": "openclaw-configuratie",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Voeg 'system.run' toe aan gateway.nodes.denyCommands of werk het beleid na controle bij."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "De sandbox-werkruimtetoegang 'rw' van agents.defaults is volgens het beleid niet toegestaan.",
  "source": "policy",
  "path": "openclaw-configuratie",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Herstel

`doctor --lint` en `policy check` zijn alleen-lezen.

`doctor --fix` bewerkt alleen door beleid beheerde werkruimte-instellingen wanneer
`workspaceRepairs` expliciet is ingeschakeld; anders melden controles wat ze
zouden herstellen en blijven de instellingen ongewijzigd.

In deze versie kan herstel kanalen uitschakelen die door `channels.denyRules`
worden geweigerd en de onderstaande automatische beperkingsreparaties toepassen.
Schakel `workspaceRepairs` pas in nadat het beleidsbestand is gecontroleerd,
omdat een geldige regel de werkruimteconfiguratie kan wijzigen:

- stel `tools.elevated.enabled=false` in wanneer algemeen beleid verhoogde hulpmiddelen verbiedt
- voeg ontbrekende, verplicht te weigeren hulpmiddel-id's toe aan `tools.deny` of
  `agents.list[].tools.deny` wanneer het beleid vereist dat die hulpmiddelen worden geweigerd
- stel onveilige `gateway.controlUi.*`-schakelaars in op `false`
- stel `gateway.mode=local` in wanneer het beleid de externe Gateway-modus weigert
- stel gemelde `gateway.http.endpoints.*.enabled`-paden in op `false` wanneer het beleid
  Gateway HTTP-API-eindpunten weigert
- stel gemelde `groupPolicy`-paden voor inkomend kanaalverkeer in op `allowlist` wanneer het beleid
  open inkomend groepsverkeer weigert
- stel gemelde `requireMention`-paden voor inkomend kanaalverkeer in op `true` wanneer het beleid
  vermeldingen in groepen vereist
- stel `logging.redactSensitive=tools` in wanneer het beleid anonimisering van gevoelige loggegevens
  vereist
- stel `diagnostics.otel.captureContent=false` in, of
  `diagnostics.otel.captureContent.enabled=false` voor telemetrie-
  opname-instellingen in objectvorm, wanneer het beleid de opname van telemetrie-inhoud weigert

Herstel van verhoogde hulpmiddelen met een beperkt bereik wordt alleen
gedetecteerd. Herstel van gegevensverwerking met een beperkt bereik wordt
eveneens overgeslagen wanneer de bevinding gedeelde logboek- of
telemetrieconfiguratie meldt, omdat het wijzigen van de gedeelde instelling meer
zou beïnvloeden dan het beleidsdoel met beperkt bereik.

Herstel van verplichte weigeringen met een beperkt bereik wordt overgeslagen
wanneer de bevinding overgenomen `tools.deny` op hoofdniveau meldt, omdat het
toevoegen van het vereiste hulpmiddel aan de hoofdconfiguratie meer zou
beïnvloeden dan het beleidsdoel met beperkt bereik. Herstel van verplichte
weigeringen op agentniveau kan het gemelde pad `agents.list[].tools.deny`
bijwerken.

Herstel van inkomend kanaalverkeer met een beperkt bereik wordt overgeslagen
wanneer de bevinding overgenomen `channels.defaults.*` meldt, omdat het wijzigen
van de gedeelde kanaalstandaard meer zou beïnvloeden dan het beleidsdoel met
beperkt bereik. Bevindingen over acceptatielijsten voor het ophalen van URL's
via Gateway HTTP blijven handmatig, omdat automatisch herstel niet de juiste
acceptatielijstwaarden voor eindpunt-URL's kan kiezen.

Bevindingen voor Gateway-bindingen en nodeopdrachten blijven een controle
vereisen. Wanneer `policy/gateway-non-loopback-bind` of
`policy/gateway-node-command-denied` aan een configuratiepad kan worden
gekoppeld, meldt `doctor --fix` de voorgestelde wijziging van `gateway.bind` of
`gateway.nodes.denyCommands` als overgeslagen voorbeeldrichtlijn. De wijziging
wordt niet toegepast en de bevinding geldt pas als hersteld nadat een beheerder
de configuratie of het beleid heeft gecontroleerd en bijgewerkt.

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

## Afsluitcodes

| Opdracht          | `0`                                                        | `1`                                                                    | `2`                              |
| ----------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| `policy check`    | Geen bevindingen op het drempelniveau.                     | Een of meer bevindingen bereikten het drempelniveau.                   | Argument- of runtimefout.        |
| `policy compare`  | Het beleidsbestand is minstens zo streng als de basislijn. | Het beleidsbestand is ongeldig, ontbreekt of is zwakker dan de basisregels. | Argument- of runtimefout.    |
| `policy watch`    | Geen bevindingen en de geaccepteerde hash is actueel.      | Er zijn bevindingen of de geaccepteerde attestatie is verouderd.       | Argument- of runtimefout.        |

## Gerelateerd

- [Lintmodus van Doctor](/nl/cli/doctor#lint-mode)
- [Pad-CLI](/nl/cli/path)
