---
read_when:
    - SecretRefs configureren voor providerreferenties en `auth-profiles.json`-referenties
    - Geheimen veilig opnieuw laden, controleren, configureren en toepassen in productieomgevingen
    - Inzicht in snel afbreken bij opstartfouten, filtering van inactieve oppervlakken en gedrag met de laatst bekende werkende configuratie
sidebarTitle: Secrets management
summary: 'Geheimenbeheer: SecretRef-contract, gedrag van runtime-snapshots en veilig eenrichtingsgewijs opschonen'
title: Geheimenbeheer
x-i18n:
    generated_at: "2026-07-16T15:49:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw ondersteunt additieve SecretRefs, zodat ondersteunde aanmeldgegevens niet als platte tekst in de configuratie hoeven te staan.

<Note>
Platte tekst werkt nog steeds. SecretRefs zijn per aanmeldgegeven optioneel.
</Note>

<Warning>
Aanmeldgegevens in platte tekst blijven leesbaar voor de agent als ze zich bevinden in bestanden die de agent kan inspecteren, waaronder `openclaw.json`, `auth-profiles.json`, `.env` of gegenereerde `agents/*/agent/models.json`-bestanden. SecretRefs verkleinen die lokale impactzone pas nadat elk ondersteund aanmeldgegeven is gemigreerd en `openclaw secrets audit --check` geen resten van platte tekst rapporteert.
</Warning>

## Runtimemodel

- Geheimen worden tijdens activering vooraf omgezet in een runtime-snapshot in het geheugen, niet pas wanneer aanvraagpaden ze nodig hebben.
- Het opstarten mislukt direct wanneer een daadwerkelijk actieve SecretRef niet kan worden omgezet.
- Opnieuw laden is een atomaire wissel: volledig geslaagd, of de laatst bekende werkende snapshot blijft behouden.
- Beleidsschendingen (bijvoorbeeld een auth-profiel in OAuth-modus gecombineerd met SecretRef-invoer) laten de activering mislukken voordat de runtime wordt gewisseld.
- Runtime-aanvragen lezen uitsluitend de actieve snapshot in het geheugen. SecretRef-aanmeldgegevens van modelproviders worden als proceslokale sentinelwaarden door auth-opslag en streamopties doorgegeven tot ze het proces verlaten. Uitgaande bezorgingspaden (bezorging van Discord-antwoorden/-threads en het verzenden van Telegram-acties) lezen die snapshot ook en zetten refs niet voor elke verzending opnieuw om.

Hierdoor hebben storingen van geheimproviders geen invloed op drukke aanvraagpaden.

## Injectie bij het verlaten van het proces (sentinelwaarden)

Voor aanmeldgegevens van modelproviders die door SecretRefs worden ondersteund, maakt OpenClaw tijdens het omzetten van modelauthenticatie een ondoorzichtige, proceslokale sentinelwaarde. Auth-opslag, streamopties, SDK-configuratie, logboeken, foutobjecten en de meeste runtime-inspectie zien daarom een waarde zoals `oc-sent-v1-...`, en niet het aanmeldgegeven van de provider. De beveiligde model-fetch en beheerde statuscontroles van lokale providers vervangen bekende sentinelwaarden in URL- en headerwaarden vlak voordat elke aanvraag het proces verlaat.

Onbekende waarden met de vorm van een sentinel worden vóór netwerkactiviteit geweigerd. OpenClaw weigert de aanvraag te verzenden in plaats van een niet-omgezette sentinel naar een provider door te sturen. Omgezette geheime waarden worden ook geregistreerd voor redactie van exacte waarden in logboeken als extra beveiligingslaag.

Provideradapters gebruiken het laatst mogelijke injectiepunt dat hun SDK ondersteunt:

- SDK's met een aangepaste fetch-optie ontvangen de beveiligde fetch van OpenClaw, zodat de SDK de sentinel behoudt.
- SDK's zonder aangepaste fetch-optie pakken de sentinel vlak vóór de constructie van de client uit. Streams van providers die eigendom zijn van een Plugin en agentharnassen pakken deze uit bij de laatste overdracht die eigendom is van de kern, omdat die transportsystemen de beveiligde fetch van OpenClaw niet delen.

Sentinelwaarden beperken de blootstelling van platte tekst in de keten voor modelaanroepen, maar bieden geen procesisolatie. De werkelijke waarde bestaat nog steeds in het geheugen van hetzelfde proces en verschijnt bij de uiteindelijke adaptergrens. Gewone omgevingsaanmeldgegevens die niet via SecretRefs zijn geconfigureerd, blijven platte tekst en vallen buiten dit mechanisme.

Stel `OPENCLAW_SECRET_SENTINELS=off` in (accepteert ook `0` of `false`, niet-hoofdlettergevoelig) om het maken van sentinelwaarden uit te schakelen tijdens incidentrespons of het oplossen van compatibiliteitsproblemen. De noodschakelaar schakelt de registratie voor redactie van exacte waarden niet uit.

## Toegangsgrens van de agent

SecretRefs voorkomen dat aanmeldgegevens in configuratie- en gegenereerde modelbestanden worden opgeslagen, maar vormen geen grens voor procesisolatie. Een aanmeldgegeven in platte tekst dat op schijf achterblijft op een pad dat de agent kan lezen, blijft leesbaar via bestands- of shelltools en omzeilt redactie op API-niveau.

Beschouw voor productie-implementaties waarin voor de agent toegankelijke bestanden binnen het bereik vallen de migratie alleen als voltooid wanneer aan al deze voorwaarden is voldaan:

- Ondersteunde aanmeldgegevens gebruiken SecretRefs in plaats van waarden in platte tekst.
- Oude resten van platte tekst zijn verwijderd uit `openclaw.json`, `auth-profiles.json`, `.env` en gegenereerde `models.json`-bestanden.
- `openclaw secrets audit --check` is na de migratie schoon.
- Alle resterende niet-ondersteunde of roterende aanmeldgegevens worden beschermd door isolatie van het besturingssysteem, containerisolatie of een externe proxy voor aanmeldgegevens.

Daarom is de workflow voor controle/configuratie/toepassing een beveiligingspoort voor migratie, en niet slechts een handig hulpmiddel.

<Warning>
SecretRefs maken willekeurige leesbare bestanden niet veilig. Back-ups, gekopieerde configuraties, oude gegenereerde modelcatalogi en niet-ondersteunde categorieën aanmeldgegevens blijven productiegeheimen totdat ze zijn verwijderd, buiten de vertrouwensgrens van de agent zijn verplaatst of afzonderlijk zijn geïsoleerd.
</Warning>

## Filteren op actieve oppervlakken

SecretRefs worden alleen gevalideerd op daadwerkelijk actieve oppervlakken:

- **Ingeschakelde oppervlakken**: niet-omgezette refs blokkeren het opstarten/opnieuw laden.
- **Inactieve oppervlakken**: niet-omgezette refs blokkeren het opstarten/opnieuw laden niet; ze geven een niet-fatale `SECRETS_REF_IGNORED_INACTIVE_SURFACE`-diagnose.

<Accordion title="Voorbeelden van inactieve oppervlakken">
- Uitgeschakelde kanaal-/accountvermeldingen.
- Aanmeldgegevens voor kanalen op het hoogste niveau die door geen enkel ingeschakeld account worden overgenomen.
- Uitgeschakelde tool-/functieoppervlakken.
- Providerspecifieke sleutels voor zoeken op internet die niet door `tools.web.search.provider` zijn geselecteerd. In de automatische modus (provider niet ingesteld) worden sleutels volgens prioriteit geraadpleegd voor automatische detectie totdat er één wordt omgezet; na de selectie zijn sleutels van niet-geselecteerde providers inactief.
- SSH-authenticatiemateriaal voor de sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus overschrijvingen per agent) is alleen actief wanneer de effectieve sandboxbackend `ssh` is en de sandboxmodus niet `off` is, voor de standaardagent of een ingeschakelde agent.
- `gateway.remote.token` / `gateway.remote.password` SecretRefs zijn actief als aan een van deze voorwaarden is voldaan:
  - `gateway.mode=remote`
  - `gateway.remote.url` is geconfigureerd
  - `gateway.tailscale.mode` is `serve` of `funnel`
  - In lokale modus zonder die externe oppervlakken: `gateway.remote.token` is actief wanneer tokenauthenticatie kan prevaleren en er geen omgevings-/authtoken is geconfigureerd; `gateway.remote.password` is alleen actief wanneer wachtwoordauthenticatie kan prevaleren en er geen omgevings-/authwachtwoord is geconfigureerd.
- `gateway.auth.token` SecretRef is inactief voor de omzetting van opstartauthenticatie wanneer `OPENCLAW_GATEWAY_TOKEN` is ingesteld, omdat invoer via een omgevingstoken voor die runtime prevaleert.

</Accordion>

## Diagnostiek van het Gateway-authenticatieoppervlak

Wanneer een SecretRef is ingesteld op `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` of `gateway.remote.password`, registreert het opstarten/opnieuw laden van de Gateway de oppervlakstatus onder code `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: de SecretRef maakt deel uit van het effectieve authenticatieoppervlak en moet worden omgezet.
- `inactive`: een ander authenticatieoppervlak prevaleert, of externe authenticatie is uitgeschakeld/niet actief.

De logvermelding bevat de reden die het beleid voor actieve oppervlakken heeft gebruikt.

## Voorcontrole van verwijzingen bij onboarding

Wanneer je tijdens interactieve onboarding voor SecretRef-opslag kiest, wordt vóór het opslaan een voorcontrole uitgevoerd:

- Omgevingsrefs: valideert de naam van de omgevingsvariabele en bevestigt dat tijdens de configuratie een niet-lege waarde zichtbaar is.
- Providerrefs (`file` of `exec`): valideert de providerselectie, zet `id` om en controleert het type van de omgezette waarde.
- Quickstart-workflow: wanneer `gateway.auth.token` al een SecretRef is, zet onboarding deze vóór het initialiseren van de probe/het dashboard om (voor `env`-, `file`- en `exec`-refs), met dezelfde poort voor direct mislukken.

Bij een validatiefout wordt de fout weergegeven en kun je het opnieuw proberen.

## SecretRef-contract

Overal dezelfde objectstructuur:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Verkorte tekenreeksen worden ook geaccepteerd in SecretInput-velden:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    - `id` moet een absolute JSON-pointer (`/...`) zijn, of de letterlijke waarde `value` voor `singleValue`-providers
    - RFC 6901-escaping in segmenten: `~` wordt `~0`, `/` wordt `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validatie:

    - `provider` moet overeenkomen met `^[a-z][a-z0-9_-]{0,63}$`
    - `id` moet overeenkomen met `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (ondersteunt selectors zoals `secret#json_key`)
    - `id` mag `.` of `..` niet bevatten als door schuine strepen gescheiden padsegmenten (bijvoorbeeld `a/../b` wordt geweigerd)

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
        mode: "json", // of "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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

<Accordion title="Omgevingsprovider">
- Optionele toelatingslijst met exacte namen via `allowlist`.
- Ontbrekende of lege omgevingswaarden laten de omzetting mislukken.

</Accordion>

<Accordion title="Bestandsprovider">
- Leest het lokale bestand op `path`.
- `mode: "json"` (standaard) verwacht een JSON-objectpayload en zet `id` om als een JSON-pointer.
- `mode: "singleValue"` verwacht ref-id `"value"` en retourneert de onbewerkte bestandsinhoud (afsluitende nieuwe regel verwijderd).
- Het pad moet eigendoms-/machtigingscontroles doorstaan; `timeoutMs` (standaard 5000) en `maxBytes` (standaard 1 MiB) begrenzen de leesbewerking.
- Windows weigert standaard: als ACL-verificatie voor het pad niet beschikbaar is, mislukt de omzetting. Stel uitsluitend voor vertrouwde paden `allowInsecurePath: true` in voor die provider om de controle over te slaan.

</Accordion>

<Accordion title="Exec-provider">
- Voert het geconfigureerde absolute binaire pad rechtstreeks uit, zonder shell.
- Standaard moet `command` een normaal bestand zijn, geen symbolische koppeling. Stel `allowSymlinkCommand: true` in om opdrachtpaden met symbolische koppelingen toe te staan (bijvoorbeeld Homebrew-shims) en combineer dit met `trustedDirs` (bijvoorbeeld `["/opt/homebrew"]`), zodat alleen paden van pakketbeheerders in aanmerking komen.
- Ondersteunt `timeoutMs` (standaard 5000), `noOutputTimeoutMs` (standaard gelijk aan `timeoutMs`), `maxOutputBytes` (standaard 1 MiB), de toelatingslijst `env`/`passEnv` en `trustedDirs`.
- `jsonOnly` is standaard ingesteld op `true`. Met `jsonOnly: false` en één aangevraagde id wordt gewone stdout die geen JSON is, geaccepteerd als de waarde van die id.
- Windows sluit standaard af bij twijfel: als ACL-verificatie niet beschikbaar is voor het opdrachtpad, mislukt de omzetting. Stel alleen voor vertrouwde paden `allowInsecurePath: true` in voor die provider om de controle over te slaan.
- Door plugins beheerde exec-providers kunnen `pluginIntegration` gebruiken in plaats van een gekopieerde `command`/`args`. OpenClaw haalt tijdens het opstarten/herladen de actuele opdrachtgegevens uit het manifest van de geïnstalleerde plugin; als de plugin is uitgeschakeld, verwijderd of niet vertrouwd is, of de integratie niet meer declareert, worden actieve SecretRefs bij die provider standaard geweigerd.

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
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` is een optionele, machineleesbare diagnose. OpenClaw toont de herkende
codes `NOT_FOUND` en `AMBIGUOUS_DUPLICATE_KEY` met de provider en referentie-id. Andere
codes en vrijevormvelden zoals `message` worden geaccepteerd voor compatibiliteit met protocol-v1,
maar niet weergegeven omdat uitvoer van de resolver referentiemateriaal kan bevatten.

</Accordion>

## API-sleutels uit bestanden

Plaats geen `file:...`-tekenreeksen in het configuratieblok `env`. Dat blok is letterlijk en overschrijft niets, waardoor `file:...` daar nooit wordt omgezet.

Gebruik in plaats daarvan een bestands-SecretRef voor een ondersteund referentieveld:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Voor `mode: "singleValue"` is de SecretRef `id` `"value"`. Gebruik voor `mode: "json"` een absolute JSON-pointer zoals `"/providers/xai/apiKey"`.

Zie [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface) voor de velden die SecretRefs accepteren.

## Voorbeelden van exec-integraties

Zie [1Password](/gateway/1password) voor een speciale 1Password-handleiding over serviceaccounts, de meegeleverde agent-Skill en probleemoplossing.

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // vereist voor binaire Homebrew-bestanden met symbolische koppelingen
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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Gebruik een resolver-wrapper om SecretRef-id's te koppelen aan itemsleutels van Bitwarden Secrets Manager. De repository bevat `scripts/secrets/openclaw-bws-resolver.mjs`; installeer of kopieer deze naar een absoluut vertrouwd pad op de host waarop de Gateway draait.

    Vereisten:

    - Bitwarden Secrets Manager CLI (`bws`) geïnstalleerd op de Gateway-host.
    - `BWS_ACCESS_TOKEN` beschikbaar voor de Gateway-service.
    - `PATH` doorgegeven aan de resolver, of `BWS_BIN` ingesteld op het absolute pad van het binaire bestand `bws`.
    - `BWS_SERVER_URL` ingesteld in de omgeving wanneer een zelfgehoste Bitwarden-instantie wordt gebruikt.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    De resolver bundelt aangevraagde id's, voert `bws secret list` uit en retourneert waarden voor overeenkomende geheime `key`-velden. Gebruik sleutels die voldoen aan het id-contract van de exec-SecretRef, zoals `openclaw/providers/openai/apiKey`; sleutels in de stijl van omgevingsvariabelen met onderstrepingstekens worden geweigerd voordat de resolver wordt uitgevoerd. Als meerdere zichtbare Bitwarden-geheimen dezelfde aangevraagde sleutel hebben, markeert de resolver die id als ambigu in plaats van te gokken. Verifieer het resolverpad nadat je de configuratie hebt bijgewerkt:

    ```bash
    openclaw secrets audit --allow-exec
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
            allowSymlinkCommand: true, // vereist voor binaire Homebrew-bestanden met symbolische koppelingen
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
  <Accordion title="password-store (`pass`)">
    Gebruik een kleine resolver-wrapper om SecretRef-id's rechtstreeks aan `pass`-vermeldingen te koppelen. Sla deze op als uitvoerbaar bestand op een absoluut pad dat de padcontroles van je exec-provider doorstaat, bijvoorbeeld `/usr/local/bin/openclaw-pass-resolver`. De `#!/usr/bin/env node`-shebang haalt `node` op uit `PATH` van het resolverproces, dus neem `PATH` op in `passEnv`. Als `pass` niet in dat `PATH` staat, stel dan `PASS_BIN` in de bovenliggende omgeving in en neem deze ook op in `passEnv`:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Kan aanvraag niet parseren: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass is afgesloten met ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Configureer vervolgens de exec-provider en laat `apiKey` verwijzen naar het pad van de `pass`-vermelding:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Bewaar het geheim op de eerste regel van de `pass`-vermelding, of pas de wrapper aan om in plaats daarvan de volledige uitvoer van `pass show` te retourneren. Verifieer na het bijwerken van de configuratie zowel de statische audit als het pad van de exec-resolver:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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
            allowSymlinkCommand: true, // vereist voor binaire Homebrew-bestanden met symbolische koppelingen
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

## Omgevingsvariabelen van de MCP-server

Omgevingsvariabelen van de MCP-server die via `plugins.entries.acpx.config.mcpServers` zijn geconfigureerd, accepteren SecretInput, zodat API-sleutels en tokens niet als platte tekst in de configuratie staan:

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

Tekenreekswaarden in platte tekst blijven werken. Omgevingssjabloonreferenties zoals `${MCP_SERVER_API_KEY}` en SecretRef-objecten worden omgezet tijdens de activering van de Gateway, voordat het MCP-serverproces wordt gestart. Net als bij andere SecretRef-oppervlakken blokkeren niet-omgezette referenties de activering alleen wanneer de plugin `acpx` daadwerkelijk actief is.

## SSH-authenticatiemateriaal voor de sandbox

De kernbackend voor de `ssh`-sandbox ondersteunt ook SecretRefs voor SSH-authenticatiemateriaal:

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

Runtimegedrag:

- OpenClaw lost deze verwijzingen op tijdens de activering van de sandbox, niet pas bij elke SSH-aanroep.
- Opgeloste waarden worden met beperkende bestandsmachtigingen (`0o600`) naar een tijdelijke map geschreven en in de gegenereerde SSH-configuratie gebruikt.
- Als de effectieve sandboxbackend niet `ssh` is (of de sandboxmodus `off` is), blijven deze verwijzingen inactief en blokkeren ze het opstarten niet.

## Ondersteund bereik van referenties

Canoniek ondersteunde en niet-ondersteunde referenties staan vermeld in [SecretRef-referentiebereik](/nl/reference/secretref-credential-surface).

<Note>
Tijdens runtime aangemaakte of roterende referenties en OAuth-vernieuwingsmateriaal zijn bewust uitgesloten van alleen-lezen SecretRef-resolutie.
</Note>

## Vereist gedrag en voorrangsregels

- Veld zonder verwijzing: ongewijzigd.
- Veld met een verwijzing: vereist op actieve oppervlakken tijdens activering.
- Als zowel platte tekst als een verwijzing aanwezig zijn, krijgt de verwijzing voorrang op ondersteunde voorrangspaden.
- De redactiesentinel `__OPENCLAW_REDACTED__` is gereserveerd voor interne redactie en herstel van configuratie en wordt geweigerd als letterlijk ingediende configuratiegegevens.

Waarschuwings- en auditsignalen:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (runtimewaarschuwing)
- `REF_SHADOWED` (auditbevinding wanneer `auth-profiles.json`-referenties voorrang krijgen boven `openclaw.json`-verwijzingen)

Compatibiliteit met Google Chat: `serviceAccountRef` krijgt voorrang boven `serviceAccount` in platte tekst; de waarde in platte tekst wordt genegeerd zodra de bijbehorende verwijzing is ingesteld.

## Activeringstriggers

Secretactivering wordt uitgevoerd bij:

- Opstarten (voorcontrole plus definitieve activering)
- Hot-apply-pad voor het opnieuw laden van de configuratie
- Pad voor herstartcontrole bij het opnieuw laden van de configuratie
- Handmatig opnieuw laden via `secrets.reload`
- Voorcontrole van de RPC voor het schrijven van de Gateway-configuratie (`config.set` / `config.apply` / `config.patch`), waarbij vóór het opslaan van bewerkingen wordt gecontroleerd of SecretRefs voor actieve oppervlakken binnen de ingediende configuratiepayload kunnen worden opgelost

Activeringscontract:

- Bij succes wordt de momentopname atomair vervangen.
- Een fout bij het opstarten breekt het opstarten van de Gateway af.
- Bij een fout tijdens het opnieuw laden in runtime blijft de laatst bekende werkende momentopname behouden.
- Bij een fout tijdens de voorcontrole van de schrijf-RPC wordt de ingediende configuratie geweigerd; zowel de configuratie op schijf als de actieve runtimemomentopname blijven ongewijzigd.
- Het opgeven van een expliciet kanaaltoken per aanroep aan een uitgaande helper-/toolaanroep activeert SecretRef niet; de activeringspunten blijven opstarten, opnieuw laden en expliciete `secrets.reload`.

## Signalen voor verminderde werking en herstel

Wanneer activering tijdens opnieuw laden na een gezonde toestand mislukt, gaat OpenClaw over naar een toestand met verminderde werking voor secrets en worden eenmalige systeemgebeurtenissen en logcodes uitgezonden:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Gedrag:

- Verminderde werking: de runtime behoudt de laatst bekende werkende momentopname.
- Hersteld: wordt eenmaal uitgezonden na de volgende geslaagde activering.
- Herhaalde fouten terwijl de werking al verminderd is, worden als waarschuwingen gelogd, maar de gebeurtenis wordt niet opnieuw uitgezonden.
- Fail-fast tijdens het opstarten zendt nooit een gebeurtenis voor verminderde werking uit, omdat de runtime nooit actief is geworden.

## Resolutie van opdrachtpaden

Opdrachtpaden kunnen via een RPC voor Gateway-momentopnamen ondersteunde SecretRef-resolutie inschakelen. Er gelden twee algemene gedragingen:

<Tabs>
  <Tab title="Strikte opdrachtpaden">
    Bijvoorbeeld `openclaw memory`-paden voor extern geheugen en `openclaw qr --remote` wanneer deze externe verwijzingen naar gedeelde secrets nodig heeft. Ze lezen uit de actieve momentopname en stoppen onmiddellijk met een fout wanneer een vereiste SecretRef niet beschikbaar is.
  </Tab>
  <Tab title="Alleen-lezen opdrachtpaden">
    Bijvoorbeeld `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` en alleen-lezen herstelstromen voor doctor/configuratie. Ook deze geven de voorkeur aan de actieve momentopname, maar gaan over op verminderde werking in plaats van af te breken wanneer een gerichte SecretRef niet beschikbaar is.

    Alleen-lezen gedrag:

    - Wanneer de Gateway actief is, lezen deze opdrachten eerst uit de actieve momentopname.
    - Als de Gateway-resolutie onvolledig is of de Gateway niet beschikbaar is, proberen ze een gerichte lokale terugvaloptie voor dat opdrachtoppervlak.
    - Als een gerichte SecretRef nog steeds niet beschikbaar is, gaat de opdracht door met alleen-lezen uitvoer met verminderde werking en een expliciete diagnose dat de verwijzing is geconfigureerd maar niet beschikbaar is in dit opdrachtpad.
    - Dit gedrag met verminderde werking geldt alleen lokaal voor de opdracht; het verzwakt de paden voor het opstarten of opnieuw laden van de runtime en voor verzenden/authenticatie niet.

  </Tab>
</Tabs>

Overige opmerkingen:

- Het vernieuwen van de momentopname na rotatie van een backendsecret wordt afgehandeld door `openclaw secrets reload`.
- Gateway-RPC-methode die door deze opdrachtpaden wordt gebruikt: `secrets.resolve`.

## Workflow voor audit en configuratie

Standaardworkflow voor operators:

<Steps>
  <Step title="Huidige toestand controleren">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs configureren en toepassen">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Opnieuw controleren">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Beschouw de migratie pas als voltooid wanneer de nieuwe audit geen problemen oplevert. Als de audit nog steeds waarden in platte tekst in opgeslagen gegevens meldt, blijft het risico op toegang door de agent bestaan, zelfs wanneer runtime-API's geredigeerde waarden retourneren.

Als je tijdens `configure` een plan opslaat in plaats van het toe te passen, pas je dat opgeslagen plan vóór de nieuwe audit toe met `openclaw secrets apply --from <plan-path>`.

<AccordionGroup>
  <Accordion title="secrets controleren">
    Bevindingen omvatten:

    - Waarden in platte tekst in opgeslagen gegevens (`openclaw.json`, `auth-profiles.json`, `.env` en gegenereerde `agents/*/agent/models.json`).
    - Restanten van gevoelige providerheaders in platte tekst in gegenereerde `models.json`-vermeldingen.
    - Niet-opgeloste verwijzingen.
    - Overschaduwing door voorrang (`auth-profiles.json` die voorrang krijgt boven `openclaw.json`-verwijzingen).
    - Restanten van verouderde gegevens (`auth.json`, OAuth-herinneringen).

    Opmerking over exec: standaard slaat de audit controles op de oplosbaarheid van exec-SecretRefs over om neveneffecten van opdrachten te voorkomen. Gebruik `openclaw secrets audit --allow-exec` om exec-providers tijdens de audit uit te voeren.

    Opmerking over headerrestanten: de detectie van gevoelige providerheaders is gebaseerd op heuristieken voor namen (veelvoorkomende namen en fragmenten van headers voor authenticatie/referenties, zoals `authorization`, `x-api-key`, `token`, `secret`, `password` en `credential`).

  </Accordion>
  <Accordion title="secrets configureren">
    Interactieve helper die:

    - Eerst `secrets.providers` configureert (`env`/`file`/`exec`, toevoegen/bewerken/verwijderen).
    - Je ondersteunde velden met secrets laat selecteren in `openclaw.json`, plus `auth-profiles.json` voor het bereik van één agent.
    - Rechtstreeks een nieuwe `auth-profiles.json`-toewijzing kan maken in de doelkiezer.
    - SecretRef-details vastlegt (`source`, `provider`, `id`).
    - Voorafgaande resolutie uitvoert en deze onmiddellijk kan toepassen.

    Opmerking over exec: de voorcontrole slaat controles van exec-SecretRefs over, tenzij `--allow-exec` is ingesteld. Als je rechtstreeks vanuit `configure --apply` toepast en het plan exec-verwijzingen/-providers bevat, laat `--allow-exec` dan ook ingesteld voor de toepassingsstap.

    Handige modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Standaardinstellingen voor het toepassen van `configure`:

    - Overeenkomende statische referenties voor de geselecteerde providers uit `auth-profiles.json` verwijderen.
    - Verouderde statische `api_key`-vermeldingen uit `auth.json` verwijderen.
    - Overeenkomende bekende secretregels uit `<config-dir>/.env` verwijderen.

  </Accordion>
  <Accordion title="secrets toepassen">
    Een opgeslagen plan toepassen:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Opmerking over exec: een droge uitvoering slaat exec-controles over, tenzij `--allow-exec` is ingesteld; de schrijfmodus weigert plannen met exec-SecretRefs/-providers, tenzij `--allow-exec` is ingesteld.

    Zie [Contract voor het toepassen van Secrets-plannen](/nl/gateway/secrets-plan-contract) voor details over het strikte doel-/padcontract en de exacte weigeringsregels.

  </Accordion>
</AccordionGroup>

## Eenrichtingsveiligheidsbeleid

<Warning>
OpenClaw schrijft bewust geen terugrolback-ups met historische secretwaarden in platte tekst.
</Warning>

Veiligheidsmodel:

- De voorcontrole moet slagen voordat de schrijfmodus wordt gestart.
- De runtimeactivering wordt vóór het vastleggen gevalideerd.
- Bij het toepassen worden bestanden bijgewerkt via atomische bestandsvervanging en wordt bij fouten naar beste vermogen herstel uitgevoerd.

## Opmerkingen over compatibiliteit met verouderde authenticatie

Voor statische referenties is de runtime niet langer afhankelijk van verouderde authenticatieopslag in platte tekst.

- De bron van runtimereferenties is de opgeloste momentopname in het geheugen.
- Verouderde statische `api_key`-vermeldingen worden verwijderd wanneer ze worden aangetroffen.
- OAuth-gerelateerd compatibiliteitsgedrag blijft afzonderlijk.

## Opmerking over de webinterface

Sommige SecretInput-unions zijn eenvoudiger te configureren in de modus voor onbewerkte bewerking dan in de formuliermodus.

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) - authenticatie instellen
- [CLI: secrets](/nl/cli/secrets) - CLI-opdrachten
- [Vault-SecretRefs](/nl/plugins/vault) - HashiCorp Vault-provider instellen
- [Omgevingsvariabelen](/nl/help/environment) - voorrang van omgevingsvariabelen
- [SecretRef-referentiebereik](/nl/reference/secretref-credential-surface) - referentiebereik
- [Contract voor het toepassen van Secrets-plannen](/nl/gateway/secrets-plan-contract) - details van het plancontract
- [Beveiliging](/nl/gateway/security) - beveiligingshouding
