---
read_when:
    - SecretRefs configureren voor providerreferenties en `auth-profiles.json`-refs
    - Het herladen van geheimen operationeel beheren, auditen, configureren en veilig toepassen in productie
    - Inzicht in direct falen bij het opstarten, filtering op inactieve oppervlakken en gedrag voor de laatst bekende werkende staat
sidebarTitle: Secrets management
summary: 'Geheimenbeheer: SecretRef-contract, runtime-snapshotgedrag en veilige eenrichtingsopschoning'
title: Geheimenbeheer
x-i18n:
    generated_at: "2026-04-29T22:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw ondersteunt additieve SecretRefs, zodat ondersteunde referenties niet als plaintext in de configuratie hoeven te worden opgeslagen.

<Note>
Plaintext blijft werken. SecretRefs zijn opt-in per referentie.
</Note>

## Doelen en runtime-model

Geheimen worden opgelost naar een in-memory runtime-snapshot.

- Resolutie gebeurt eager tijdens activatie, niet lazy op aanvraagpaden.
- Startup faalt snel wanneer een effectief actieve SecretRef niet kan worden opgelost.
- Reload gebruikt atomic swap: volledig succes, of de laatst bekende goede snapshot behouden.
- SecretRef-beleidsschendingen (bijvoorbeeld auth-profielen in OAuth-modus gecombineerd met SecretRef-invoer) laten activatie falen voordat de runtime-swap plaatsvindt.
- Runtime-aanvragen lezen alleen uit de actieve in-memory snapshot.
- Na de eerste succesvolle configuratieactivatie/load blijven runtime-codepaden die actieve in-memory snapshot lezen totdat een succesvolle reload deze verwisselt.
- Uitgaande afleverpaden lezen ook uit die actieve snapshot (bijvoorbeeld Discord-antwoord/thread-aflevering en Telegram-actieverzendingen); ze lossen SecretRefs niet opnieuw op bij elke verzending.

Dit houdt storingen bij secret-providers buiten hete aanvraagpaden.

## Filteren op actieve oppervlakken

SecretRefs worden alleen gevalideerd op effectief actieve oppervlakken.

- Ingeschakelde oppervlakken: niet-opgeloste refs blokkeren startup/reload.
- Inactieve oppervlakken: niet-opgeloste refs blokkeren startup/reload niet.
- Inactieve refs geven niet-fatale diagnostiek met code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Voorbeelden van inactieve oppervlakken">
    - Uitgeschakelde kanaal-/accountvermeldingen.
    - Top-level kanaalreferenties die door geen enkel ingeschakeld account worden geërfd.
    - Uitgeschakelde tool-/functieoppervlakken.
    - Webzoek-provider-specifieke sleutels die niet door `tools.web.search.provider` zijn geselecteerd. In automatische modus (provider niet ingesteld) worden sleutels volgens prioriteit geraadpleegd voor automatische providerdetectie totdat er één wordt opgelost. Na selectie worden niet-geselecteerde providersleutels als inactief behandeld totdat ze worden geselecteerd.
    - Sandbox SSH-auth-materiaal (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus overrides per agent) is alleen actief wanneer de effectieve sandbox-backend `ssh` is voor de standaardagent of een ingeschakelde agent.
    - `gateway.remote.token` / `gateway.remote.password` SecretRefs zijn actief als een van deze waar is:
      - `gateway.mode=remote`
      - `gateway.remote.url` is geconfigureerd
      - `gateway.tailscale.mode` is `serve` of `funnel`
      - In lokale modus zonder die remote-oppervlakken:
        - `gateway.remote.token` is actief wanneer tokenauth kan winnen en er geen env-/authtoken is geconfigureerd.
        - `gateway.remote.password` is alleen actief wanneer wachtwoordauth kan winnen en er geen env-/authwachtwoord is geconfigureerd.
    - `gateway.auth.token` SecretRef is inactief voor startup-auth-resolutie wanneer `OPENCLAW_GATEWAY_TOKEN` is ingesteld, omdat env-tokeninvoer voor die runtime wint.

  </Accordion>
</AccordionGroup>

## Diagnostiek voor Gateway-auth-oppervlak

Wanneer een SecretRef is geconfigureerd op `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` of `gateway.remote.password`, logt Gateway-startup/reload de oppervlaktestatus expliciet:

- `active`: de SecretRef maakt deel uit van het effectieve auth-oppervlak en moet worden opgelost.
- `inactive`: de SecretRef wordt voor deze runtime genegeerd omdat een ander auth-oppervlak wint, of omdat remote-auth is uitgeschakeld/niet actief is.

Deze vermeldingen worden gelogd met `SECRETS_GATEWAY_AUTH_SURFACE` en bevatten de reden die door het actieve-oppervlakkenbeleid is gebruikt, zodat je kunt zien waarom een referentie als actief of inactief is behandeld.

## Preflightcontrole voor onboarding-referenties

Wanneer onboarding in interactieve modus wordt uitgevoerd en je SecretRef-opslag kiest, voert OpenClaw preflightvalidatie uit voordat er wordt opgeslagen:

- Env-refs: valideert de env-var-naam en bevestigt dat tijdens setup een niet-lege waarde zichtbaar is.
- Provider-refs (`file` of `exec`): valideert providerselectie, lost `id` op en controleert het type van de opgeloste waarde.
- Quickstart-hergebruikpad: wanneer `gateway.auth.token` al een SecretRef is, lost onboarding deze op vóór probe/dashboard-bootstrap (voor `env`-, `file`- en `exec`-refs) met dezelfde fail-fast gate.

Als validatie faalt, toont onboarding de fout en kun je het opnieuw proberen.

## SecretRef-contract

Gebruik overal één objectvorm:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Validatie:

    - `provider` moet overeenkomen met `^[a-z][a-z0-9_-]{0,63}$`
    - `id` moet overeenkomen met `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validatie:

    - `provider` moet overeenkomen met `^[a-z][a-z0-9_-]{0,63}$`
    - `id` moet een absolute JSON pointer (`/...`) zijn
    - RFC6901-escaping in segmenten: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validatie:

    - `provider` moet overeenkomen met `^[a-z][a-z0-9_-]{0,63}$`
    - `id` moet overeenkomen met `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` mag geen `.` of `..` bevatten als door slashes gescheiden padsegmenten (bijvoorbeeld `a/../b` wordt geweigerd)

  </Tab>
</Tabs>

## Providerconfiguratie

Definieer providers onder `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Env-provider">
    - Optionele allowlist via `allowlist`.
    - Ontbrekende/lege env-waarden laten resolutie falen.

  </Accordion>
  <Accordion title="File-provider">
    - Leest lokaal bestand uit `path`.
    - `mode: "json"` verwacht een JSON-objectpayload en lost `id` op als pointer.
    - `mode: "singleValue"` verwacht ref-id `"value"` en retourneert bestandsinhoud.
    - Pad moet eigendoms-/machtigingscontroles doorstaan.
    - Windows fail-closed-opmerking: als ACL-verificatie niet beschikbaar is voor een pad, faalt resolutie. Stel alleen voor vertrouwde paden `allowInsecurePath: true` in op die provider om padbeveiligingscontroles te omzeilen.

  </Accordion>
  <Accordion title="Exec-provider">
    - Voert geconfigureerd absoluut binair pad uit, zonder shell.
    - Standaard moet `command` naar een regulier bestand wijzen (geen symlink).
    - Stel `allowSymlinkCommand: true` in om symlink-commandopaden toe te staan (bijvoorbeeld Homebrew-shims). OpenClaw valideert het opgeloste doelpad.
    - Combineer `allowSymlinkCommand` met `trustedDirs` voor package-managerpaden (bijvoorbeeld `["/opt/homebrew"]`).
    - Ondersteunt timeout, no-output timeout, uitvoerbytelimieten, env-allowlist en vertrouwde mappen.
    - Windows fail-closed-opmerking: als ACL-verificatie niet beschikbaar is voor het commandopad, faalt resolutie. Stel alleen voor vertrouwde paden `allowInsecurePath: true` in op die provider om padbeveiligingscontroles te omzeilen.

    Aanvraagpayload (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Antwoordpayload (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Optionele fouten per id:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Exec-integratievoorbeelden

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## MCP-serveromgevingsvariabelen

MCP-server-env-vars die via `plugins.entries.acpx.config.mcpServers` zijn geconfigureerd, ondersteunen SecretInput. Dit houdt API-sleutels en tokens uit plaintext-configuratie:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Plaintext stringwaarden blijven werken. Env-template-refs zoals `${MCP_SERVER_API_KEY}` en SecretRef-objecten worden tijdens Gateway-activatie opgelost voordat het MCP-serverproces wordt gestart. Net als bij andere SecretRef-oppervlakken blokkeren niet-opgeloste refs activatie alleen wanneer de `acpx`-plugin effectief actief is.

## Sandbox SSH-auth-materiaal

De core `ssh` sandbox-backend ondersteunt ook SecretRefs voor SSH-auth-materiaal:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Runtime-gedrag:

- OpenClaw lost deze refs op tijdens sandbox-activering, niet lui tijdens elke SSH-aanroep.
- Opgeloste waarden worden naar tijdelijke bestanden met beperkende machtigingen geschreven en gebruikt in de gegenereerde SSH-configuratie.
- Als de effectieve sandbox-backend niet `ssh` is, blijven deze refs inactief en blokkeren ze het opstarten niet.

## Ondersteund oppervlak voor inloggegevens

Canonieke ondersteunde en niet-ondersteunde inloggegevens staan vermeld in:

- [SecretRef-oppervlak voor inloggegevens](/nl/reference/secretref-credential-surface)

<Note>
Tijdens runtime aangemaakte of roterende inloggegevens en OAuth-refreshmateriaal zijn bewust uitgesloten van read-only SecretRef-resolutie.
</Note>

## Vereist gedrag en prioriteit

- Veld zonder ref: ongewijzigd.
- Veld met een ref: vereist op actieve oppervlakken tijdens activering.
- Als zowel platte tekst als ref aanwezig zijn, krijgt ref prioriteit op ondersteunde prioriteitspaden.
- De redactie-sentinel `__OPENCLAW_REDACTED__` is gereserveerd voor interne configuratieredactie/-herstel en wordt afgewezen als letterlijke ingediende configuratiegegevens.

Waarschuwings- en auditsignalen:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (runtimewaarschuwing)
- `REF_SHADOWED` (auditbevinding wanneer `auth-profiles.json`-inloggegevens prioriteit krijgen boven `openclaw.json`-refs)

Compatibiliteitsgedrag voor Google Chat:

- `serviceAccountRef` krijgt prioriteit boven platte tekst `serviceAccount`.
- De plattetekstwaarde wordt genegeerd wanneer de sibling-ref is ingesteld.

## Activeringstriggers

Geheimactivering wordt uitgevoerd bij:

- Opstarten (preflight plus definitieve activering)
- Hot-apply-pad voor configuratieherladen
- Herstartcontrolepad voor configuratieherladen
- Handmatig herladen via `secrets.reload`
- Preflight van Gateway-configuratieschrijf-RPC (`config.set` / `config.apply` / `config.patch`) voor SecretRef-oplosbaarheid van actief oppervlak binnen de ingediende configuratiepayload voordat bewerkingen worden opgeslagen

Activeringscontract:

- Succes wisselt de snapshot atomair om.
- Opstartfout breekt het opstarten van de Gateway af.
- Fout bij runtimeherladen behoudt de laatst bekende goede snapshot.
- Preflightfout van schrijf-RPC wijst de ingediende configuratie af en houdt zowel de schijfconfiguratie als de actieve runtime-snapshot ongewijzigd.
- Het opgeven van een expliciet kanaaltoken per aanroep aan een uitgaande helper-/toolaanroep triggert geen SecretRef-activering; activeringspunten blijven opstarten, herladen en expliciet `secrets.reload`.

## Gedegradeerde en herstelde signalen

Wanneer activering tijdens herladen mislukt na een gezonde toestand, gaat OpenClaw naar een gedegradeerde geheimstatus.

Eenmalige systeemevent- en logcodes:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Gedrag:

- Gedegradeerd: runtime behoudt de laatst bekende goede snapshot.
- Hersteld: eenmaal uitgezonden na de volgende succesvolle activering.
- Herhaalde fouten terwijl de status al gedegradeerd is, loggen waarschuwingen maar spammen geen events.
- Fail-fast bij opstarten zendt geen gedegradeerde events uit, omdat runtime nooit actief is geworden.

## Resolutie van commandopaden

Commandopaden kunnen zich aanmelden voor ondersteunde SecretRef-resolutie via Gateway-snapshot-RPC.

Er zijn twee brede gedragingen:

<Tabs>
  <Tab title="Strikte commandopaden">
    Bijvoorbeeld externe-geheugenpaden van `openclaw memory` en `openclaw qr --remote` wanneer externe shared-secret-refs nodig zijn. Ze lezen uit de actieve snapshot en falen snel wanneer een vereiste SecretRef niet beschikbaar is.
  </Tab>
  <Tab title="Read-only commandopaden">
    Bijvoorbeeld `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` en read-only doctor-/configuratiereparatiestromen. Ze geven ook de voorkeur aan de actieve snapshot, maar degraderen in plaats van af te breken wanneer een gerichte SecretRef in dat commandopad niet beschikbaar is.

    Read-only gedrag:

    - Wanneer de Gateway draait, lezen deze commando's eerst uit de actieve snapshot.
    - Als Gateway-resolutie onvolledig is of de Gateway niet beschikbaar is, proberen ze gerichte lokale fallback voor het specifieke commando-oppervlak.
    - Als een gerichte SecretRef nog steeds niet beschikbaar is, gaat het commando door met gedegradeerde read-only uitvoer en expliciete diagnostiek zoals "geconfigureerd maar niet beschikbaar in dit commandopad".
    - Dit gedegradeerde gedrag is alleen lokaal voor het commando. Het verzwakt runtime-opstarten, herladen of verzend-/authenticatiepaden niet.

  </Tab>
</Tabs>

Overige opmerkingen:

- Snapshotverversing na secretrotatie in de backend wordt afgehandeld door `openclaw secrets reload`.
- Gateway-RPC-methode die door deze commandopaden wordt gebruikt: `secrets.resolve`.

## Audit- en configuratieworkflow

Standaard operatorflow:

<Steps>
  <Step title="Huidige status auditen">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs configureren">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Opnieuw auditen">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Bevindingen omvatten:

    - plattetekstwaarden in rust (`openclaw.json`, `auth-profiles.json`, `.env` en gegenereerde `agents/*/agent/models.json`)
    - restanten van gevoelige providerheaders in platte tekst in gegenereerde `models.json`-vermeldingen
    - onopgeloste refs
    - prioriteitsoverschaduwing (`auth-profiles.json` krijgt prioriteit boven `openclaw.json`-refs)
    - legacy-restanten (`auth.json`, OAuth-herinneringen)

    Exec-opmerking:

    - Standaard slaat audit oplosbaarheidscontroles voor exec SecretRefs over om bijwerkingen van commando's te vermijden.
    - Gebruik `openclaw secrets audit --allow-exec` om exec-providers tijdens audit uit te voeren.

    Opmerking over headerrestanten:

    - Detectie van gevoelige providerheaders is gebaseerd op naamheuristiek (veelvoorkomende namen en fragmenten van auth-/credentialheaders zoals `authorization`, `x-api-key`, `token`, `secret`, `password` en `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interactieve helper die:

    - eerst `secrets.providers` configureert (`env`/`file`/`exec`, toevoegen/bewerken/verwijderen)
    - je ondersteunde velden met geheimen in `openclaw.json` plus `auth-profiles.json` laat selecteren voor één agentscope
    - direct in de doelkiezer een nieuwe `auth-profiles.json`-mapping kan maken
    - SecretRef-details vastlegt (`source`, `provider`, `id`)
    - preflight-resolutie uitvoert
    - direct kan toepassen

    Exec-opmerking:

    - Preflight slaat exec SecretRef-controles over tenzij `--allow-exec` is ingesteld.
    - Als je direct toepast vanuit `configure --apply` en het plan exec-refs/providers bevat, houd `--allow-exec` dan ook ingesteld voor de toepasstap.

    Handige modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Standaardwaarden voor toepassen met `configure`:

    - overeenkomende statische inloggegevens uit `auth-profiles.json` verwijderen voor gerichte providers
    - legacy statische `api_key`-vermeldingen uit `auth.json` verwijderen
    - overeenkomende bekende geheimregels uit `<config-dir>/.env` verwijderen

  </Accordion>
  <Accordion title="secrets apply">
    Een opgeslagen plan toepassen:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec-opmerking:

    - dry-run slaat exec-controles over tenzij `--allow-exec` is ingesteld.
    - schrijfmodus wijst plannen met exec SecretRefs/providers af tenzij `--allow-exec` is ingesteld.

    Zie [Contract voor Secrets Apply-plan](/nl/gateway/secrets-plan-contract) voor details over het strikte doel-/padcontract en exacte afwijzingsregels.

  </Accordion>
</AccordionGroup>

## Eenrichtingsveiligheidsbeleid

<Warning>
OpenClaw schrijft bewust geen rollbackback-ups die historische geheime waarden in platte tekst bevatten.
</Warning>

Veiligheidsmodel:

- preflight moet slagen vóór schrijfmodus
- runtime-activering wordt gevalideerd vóór commit
- apply werkt bestanden bij met atomaire bestandsvervanging en best-effort herstel bij fouten

## Compatibiliteitsopmerkingen voor legacy-authenticatie

Voor statische inloggegevens is runtime niet langer afhankelijk van legacy-authenticatieopslag in platte tekst.

- Runtimebron voor inloggegevens is de opgeloste in-memory snapshot.
- Legacy statische `api_key`-vermeldingen worden verwijderd wanneer ze worden ontdekt.
- OAuth-gerelateerd compatibiliteitsgedrag blijft gescheiden.

## Opmerking over Web UI

Sommige SecretInput-unions zijn gemakkelijker te configureren in raw-editormodus dan in formuliermodus.

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) — auth-installatie
- [CLI: secrets](/nl/cli/secrets) — CLI-commando's
- [Omgevingsvariabelen](/nl/help/environment) — omgevingsprioriteit
- [SecretRef-oppervlak voor inloggegevens](/nl/reference/secretref-credential-surface) — oppervlak voor inloggegevens
- [Contract voor Secrets Apply-plan](/nl/gateway/secrets-plan-contract) — details van plancontract
- [Beveiliging](/nl/gateway/security) — beveiligingshouding
