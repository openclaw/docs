---
read_when:
    - SecretRefs configureren voor providerreferenties en `auth-profiles.json` refs
    - Productiegeheimen veilig opnieuw laden, controleren, configureren en toepassen
    - Inzicht in fail-fast bij opstarten, filtering van inactieve oppervlakken en last-known-good-gedrag
sidebarTitle: Secrets management
summary: 'Geheimenbeheer: SecretRef-contract, runtime-snapshotgedrag en veilig eenrichtingsscrubben'
title: Geheimenbeheer
x-i18n:
    generated_at: "2026-06-27T17:37:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw ondersteunt additieve SecretRefs, zodat ondersteunde referenties niet als platte tekst in configuratie hoeven te worden opgeslagen.

<Note>
Platte tekst werkt nog steeds. SecretRefs zijn opt-in per referentie.
</Note>

<Warning>
Referenties in platte tekst blijven leesbaar voor de agent als ze zijn opgeslagen in bestanden die de
agent kan inspecteren, waaronder `openclaw.json`, `auth-profiles.json`, `.env`, of
gegenereerde `agents/*/agent/models.json`-bestanden. SecretRefs verkleinen die lokale blast radius
pas nadat elke ondersteunde referentie is gemigreerd en
`openclaw secrets audit --check` meldt dat er geen resten van secrets in platte tekst meer zijn.
</Warning>

## Doelen en runtime-model

Secrets worden opgelost naar een runtime-snapshot in het geheugen.

- Resolutie gebeurt eager tijdens activering, niet lazy op aanvraagpaden.
- Opstarten faalt snel wanneer een effectief actieve SecretRef niet kan worden opgelost.
- Herladen gebruikt een atomische wissel: volledig succes, of de laatst bekende goede snapshot behouden.
- SecretRef-beleidsschendingen (bijvoorbeeld auth-profielen in OAuth-modus gecombineerd met SecretRef-invoer) laten activering falen vóór de runtime-wissel.
- Runtime-aanvragen lezen alleen uit de actieve snapshot in het geheugen.
- Na de eerste succesvolle configuratieactivering/-load blijven runtime-codepaden die actieve snapshot in het geheugen lezen totdat een succesvolle herlaadactie deze vervangt.
- Uitgaande leveringspaden lezen ook uit die actieve snapshot (bijvoorbeeld Discord-antwoord-/threadlevering en Telegram-actieverzendingen); ze lossen SecretRefs niet bij elke verzending opnieuw op.

Dit houdt storingen bij secret-providers weg van hot request paths.

## Grens voor agenttoegang

SecretRefs beschermen referenties tegen persistentie in ondersteunde configuratie en
gegenereerde modeloppervlakken, maar ze vormen geen procesisolatiegrens. Als een
referentie in platte tekst op schijf blijft staan in een pad dat de agent kan lezen, kan de agent
API-niveau-redactie omzeilen door bestands- of shell-tools te gebruiken om dat bestand te inspecteren.

Voor productie-implementaties waarin voor agents toegankelijke bestanden binnen scope vallen, behandel
SecretRef-migratie alleen als voltooid wanneer al het volgende waar is:

- ondersteunde referenties gebruiken SecretRefs in plaats van waarden in platte tekst
- legacy-resten in platte tekst zijn opgeschoond uit `openclaw.json`,
  `auth-profiles.json`, `.env`, en gegenereerde `models.json`-bestanden
- `openclaw secrets audit --check` is schoon na de migratie
- resterende niet-ondersteunde of roterende referenties worden beschermd door isolatie van het
  besturingssysteem, containerisolatie, of een externe referentieproxy

Daarom is de audit-/configure-/apply-workflow een beveiligingsmigratiepoort, niet
alleen een handige helper.

<Warning>
SecretRefs maken willekeurige leesbare bestanden niet veilig. Back-ups, gekopieerde configuraties,
oude gegenereerde modelcatalogi, en niet-ondersteunde referentieklassen moeten worden behandeld
als productiesecrets totdat ze zijn verwijderd, buiten de vertrouwensgrens van de agent zijn verplaatst,
of worden beschermd door een afzonderlijke isolatielaag.
</Warning>

## Filtering van actieve oppervlakken

SecretRefs worden alleen gevalideerd op effectief actieve oppervlakken.

- Ingeschakelde oppervlakken: niet-opgeloste refs blokkeren opstarten/herladen.
- Inactieve oppervlakken: niet-opgeloste refs blokkeren opstarten/herladen niet.
- Inactieve refs geven niet-fatale diagnostiek met code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - Uitgeschakelde kanaal-/accountvermeldingen.
    - Kanaalreferenties op topniveau die door geen enkel ingeschakeld account worden geërfd.
    - Uitgeschakelde tool-/functieoppervlakken.
    - Webzoek-providerspecifieke sleutels die niet zijn geselecteerd door `tools.web.search.provider`. In automatische modus (provider niet ingesteld) worden sleutels op basis van prioriteit geraadpleegd voor automatische providerdetectie totdat er één wordt opgelost. Na selectie worden niet-geselecteerde providersleutels als inactief behandeld totdat ze worden geselecteerd.
    - Sandbox-SSH-authmateriaal (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus overrides per agent) is alleen actief wanneer de effectieve sandbox-backend `ssh` is voor de standaardagent of een ingeschakelde agent.
    - `gateway.remote.token` / `gateway.remote.password` SecretRefs zijn actief als een van de volgende dingen waar is:
      - `gateway.mode=remote`
      - `gateway.remote.url` is geconfigureerd
      - `gateway.tailscale.mode` is `serve` of `funnel`
      - In lokale modus zonder die remote oppervlakken:
        - `gateway.remote.token` is actief wanneer token-auth kan winnen en er geen env-/auth-token is geconfigureerd.
        - `gateway.remote.password` is alleen actief wanneer wachtwoord-auth kan winnen en er geen env-/auth-wachtwoord is geconfigureerd.
    - `gateway.auth.token` SecretRef is inactief voor auth-resolutie bij het opstarten wanneer `OPENCLAW_GATEWAY_TOKEN` is ingesteld, omdat env-tokeninvoer wint voor die runtime.

  </Accordion>
</AccordionGroup>

## Diagnostiek voor Gateway-authoppervlak

Wanneer een SecretRef is geconfigureerd op `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, of `gateway.remote.password`, logt Gateway-opstarten/-herladen de oppervlaktestatus expliciet:

- `active`: de SecretRef maakt deel uit van het effectieve auth-oppervlak en moet worden opgelost.
- `inactive`: de SecretRef wordt genegeerd voor deze runtime omdat een ander auth-oppervlak wint, of omdat remote auth is uitgeschakeld/niet actief is.

Deze vermeldingen worden gelogd met `SECRETS_GATEWAY_AUTH_SURFACE` en bevatten de reden die door het beleid voor actieve oppervlakken wordt gebruikt, zodat je kunt zien waarom een referentie als actief of inactief is behandeld.

## Onboarding-referentiepreflight

Wanneer onboarding in interactieve modus draait en je SecretRef-opslag kiest, voert OpenClaw preflight-validatie uit voordat er wordt opgeslagen:

- Env-refs: valideert de naam van de env-var en bevestigt dat een niet-lege waarde zichtbaar is tijdens setup.
- Provider-refs (`file` of `exec`): valideert providerselectie, lost `id` op, en controleert het type van de opgeloste waarde.
- Quickstart-hergebruikpad: wanneer `gateway.auth.token` al een SecretRef is, lost onboarding deze op vóór probe-/dashboard-bootstrap (voor `env`-, `file`-, en `exec`-refs) met dezelfde fail-fast-poort.

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

    Ondersteunde SecretInput-velden accepteren ook exacte string-shorthands:

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
    - `id` moet een absolute JSON-pointer zijn (`/...`)
    - RFC6901-escaping in segmenten: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validatie:

    - `provider` moet overeenkomen met `^[a-z][a-z0-9_-]{0,63}$`
    - `id` moet overeenkomen met `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (ondersteunt selectors zoals `secret#json_key`)
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

<AccordionGroup>
  <Accordion title="Env provider">
    - Optionele allowlist via `allowlist`.
    - Ontbrekende/lege env-waarden laten resolutie falen.

  </Accordion>
  <Accordion title="File provider">
    - Leest lokaal bestand uit `path`.
    - `mode: "json"` verwacht een JSON-objectpayload en lost `id` op als pointer.
    - `mode: "singleValue"` verwacht ref-id `"value"` en retourneert bestandsinhoud.
    - Pad moet eigendoms-/machtigingscontroles doorstaan.
    - Windows fail-closed-opmerking: als ACL-verificatie niet beschikbaar is voor een pad, faalt resolutie. Stel voor alleen vertrouwde paden `allowInsecurePath: true` in op die provider om padbeveiligingscontroles te omzeilen.

  </Accordion>
  <Accordion title="Exec provider">
    - Voert geconfigureerd absoluut binair pad uit, zonder shell.
    - Standaard moet `command` naar een normaal bestand verwijzen (geen symlink).
    - Stel `allowSymlinkCommand: true` in om symlink-commandopaden toe te staan (bijvoorbeeld Homebrew-shims). OpenClaw valideert het opgeloste doelpad.
    - Combineer `allowSymlinkCommand` met `trustedDirs` voor package-managerpaden (bijvoorbeeld `["/opt/homebrew"]`).
    - Ondersteunt timeout, timeout bij geen uitvoer, byte-limieten voor uitvoer, env-allowlist, en vertrouwde mappen.
    - Windows fail-closed-opmerking: als ACL-verificatie niet beschikbaar is voor het commandopad, faalt resolutie. Stel voor alleen vertrouwde paden `allowInsecurePath: true` in op die provider om padbeveiligingscontroles te omzeilen.
    - Door Plugin beheerde exec-providers kunnen `pluginIntegration` gebruiken in plaats van
      gekopieerde `command`/`args`. OpenClaw lost de huidige commandodetails
      op uit het geïnstalleerde pluginmanifest tijdens opstarten/herladen. Als de plugin is
      uitgeschakeld, verwijderd, niet vertrouwd, of de integratie niet langer declareert,
      falen actieve SecretRefs die die provider gebruiken fail-closed.

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

## Bestandsgebaseerde API-sleutels

Plaats geen `file:...`-strings in het configuratieblok `env`. Het blok `env` is
letterlijk en niet-overschrijvend, dus `file:...` wordt niet opgelost.

Gebruik in plaats daarvan een file-SecretRef op een ondersteund referentieveld:

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

Voor `mode: "singleValue"` is de SecretRef-`id` `"value"`. Voor
`mode: "json"` gebruik je een absolute JSON-pointer zoals
`"/providers/xai/apiKey"`.

Zie [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface) voor
de configuratievelden die SecretRefs accepteren.

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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Gebruik een resolver-wrapper wanneer je SecretRef-id's wilt koppelen aan itemsleutels van Bitwarden
    Secrets Manager. De repository bevat
    `scripts/secrets/openclaw-bws-resolver.mjs`; installeer of kopieer deze naar een absoluut
    vertrouwd pad op de host waarop de Gateway draait.

    Vereisten:

    - Bitwarden Secrets Manager CLI (`bws`) geinstalleerd op de Gateway-host.
    - `BWS_ACCESS_TOKEN` beschikbaar voor de Gateway-service.
    - `PATH` doorgegeven aan de resolver, of `BWS_BIN` ingesteld op het absolute pad naar de
      `bws`-binary.
    - `BWS_SERVER_URL` moet in de omgeving zijn ingesteld wanneer je een zelfgehoste
      Bitwarden-instantie gebruikt.

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

    De resolver batchet aangevraagde id's, voert `bws secret list` uit en retourneert
    waarden voor overeenkomende geheime `key`-velden. Gebruik sleutels die voldoen aan het exec
    SecretRef-idcontract, zoals `openclaw/providers/openai/apiKey`; env-var-achtige
    sleutels met underscores worden geweigerd voordat de resolver wordt uitgevoerd. Als meer
    dan een zichtbaar Bitwarden-geheim dezelfde aangevraagde sleutel heeft, laat de resolver
    dat id mislukken als dubbelzinnig in plaats van er een te kiezen. Controleer na het bijwerken van de configuratie
    het resolver-pad:

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
  <Accordion title="password-store (`pass`)">
    Gebruik een kleine resolver-wrapper wanneer je SecretRef-id's rechtstreeks wilt koppelen aan
    `pass`-vermeldingen. Sla deze op als uitvoerbaar bestand in een absoluut pad dat slaagt
    voor je padcontroles voor exec-providers, bijvoorbeeld
    `/usr/local/bin/openclaw-pass-resolver`. De shebang `#!/usr/bin/env node`
    lost `node` op vanuit het `PATH` van het resolver-proces, dus neem `PATH` op in
    `passEnv`. Als `pass` niet op dat `PATH` staat, stel dan `PASS_BIN` in de bovenliggende
    omgeving in en neem het ook op in `passEnv`:

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
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
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

    Houd het geheim op de eerste regel van de `pass`-vermelding, of pas de
    wrapper aan als je in plaats daarvan de volledige uitvoer van `pass show` wilt retourneren. Controleer na
    het bijwerken van de configuratie zowel de statische audit als het exec-resolver-pad:

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

MCP-server-env vars die via `plugins.entries.acpx.config.mcpServers` zijn geconfigureerd, ondersteunen SecretInput. Dit houdt API-sleutels en tokens uit plaintext-configuratie:

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

Plaintext-tekenreekswaarden blijven werken. Env-templateverwijzingen zoals `${MCP_SERVER_API_KEY}` en SecretRef-objecten worden opgelost tijdens Gateway-activering voordat het MCP-serverproces wordt gestart. Net als bij andere SecretRef-oppervlakken blokkeren onopgeloste verwijzingen de activering alleen wanneer de `acpx`-plugin effectief actief is.

## Sandbox-SSH-authenticatiemateriaal

De core `ssh`-sandboxbackend ondersteunt ook SecretRefs voor SSH-authenticatiemateriaal:

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

- OpenClaw lost deze verwijzingen op tijdens sandbox-activering, niet lazy tijdens elke SSH-aanroep.
- Opgeloste waarden worden naar tijdelijke bestanden geschreven met beperkende rechten en gebruikt in gegenereerde SSH-configuratie.
- Als de effectieve sandboxbackend niet `ssh` is, blijven deze verwijzingen inactief en blokkeren ze het opstarten niet.

## Ondersteund credential-oppervlak

Canonieke ondersteunde en niet-ondersteunde credentials staan vermeld in:

- [SecretRef Credential Surface](/nl/reference/secretref-credential-surface)

<Note>
Door runtime aangemaakte of roterende credentials en OAuth-verversingsmateriaal zijn opzettelijk uitgesloten van alleen-lezen SecretRef-resolutie.
</Note>

## Vereist gedrag en voorrang

- Veld zonder verwijzing: ongewijzigd.
- Veld met een verwijzing: vereist op actieve oppervlakken tijdens activering.
- Als zowel plaintext als verwijzing aanwezig zijn, heeft de verwijzing voorrang op ondersteunde voorrangspaden.
- De redaction-sentinel `__OPENCLAW_REDACTED__` is gereserveerd voor interne configuratieredactie/herstel en wordt geweigerd als letterlijke ingediende configuratiedata.

Waarschuwings- en auditsignalen:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (runtimewaarschuwing)
- `REF_SHADOWED` (auditbevinding wanneer `auth-profiles.json`-credentials voorrang hebben op `openclaw.json`-verwijzingen)

Compatibiliteitsgedrag voor Google Chat:

- `serviceAccountRef` heeft voorrang op plaintext `serviceAccount`.
- Plaintext-waarde wordt genegeerd wanneer een naastgelegen verwijzing is ingesteld.

## Activeringstriggers

Geheimactivering wordt uitgevoerd bij:

- Opstarten (preflight plus definitieve activering)
- Configuratieherlaadpad met hot-apply
- Configuratieherlaadpad met herstartcontrole
- Handmatig herladen via `secrets.reload`
- Gateway-configuratieschrijf-RPC-preflight (`config.set` / `config.apply` / `config.patch`) voor SecretRef-oplosbaarheid van actieve oppervlakken binnen de ingediende configuratiepayload voordat wijzigingen worden opgeslagen

Activeringscontract:

- Succes wisselt de snapshot atomisch om.
- Opstartfout breekt het opstarten van de Gateway af.
- Runtime-herlaadfout behoudt de laatst bekende goede snapshot.
- Schrijf-RPC-preflightfout weigert de ingediende configuratie en laat zowel de schijfconfiguratie als de actieve runtime-snapshot ongewijzigd.
- Het opgeven van een expliciet kanaaltoken per aanroep aan een outbound helper/tool-aanroep triggert geen SecretRef-activering; activeringspunten blijven opstarten, herladen en expliciet `secrets.reload`.

## Signalen voor degraded en recovered

Wanneer activering tijdens herladen faalt na een gezonde status, gaat OpenClaw naar een degraded secrets-status.

Eenmalige systeemevent- en logcodes:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Gedrag:

- Degraded: runtime behoudt de laatst bekende goede snapshot.
- Recovered: eenmaal uitgezonden na de volgende succesvolle activering.
- Herhaalde fouten terwijl al degraded wordt waarschuwingen gelogd, maar events worden niet gespamd.
- Fail-fast bij opstarten zendt geen degraded-events uit omdat runtime nooit actief is geworden.

## Resolutie van commandopaden

Commandopaden kunnen ondersteunde SecretRef-resolutie inschakelen via Gateway-snapshot-RPC.

Er zijn twee brede gedragingen:

<Tabs>
  <Tab title="Strikte opdrachtpaden">
    Bijvoorbeeld paden voor extern geheugen van `openclaw memory` en `openclaw qr --remote` wanneer externe verwijzingen naar gedeelde geheimen nodig zijn. Ze lezen uit de actieve snapshot en falen snel wanneer een vereiste SecretRef niet beschikbaar is.
  </Tab>
  <Tab title="Alleen-lezen opdrachtpaden">
    Bijvoorbeeld `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` en alleen-lezen doctor-/configuratiereparatiestromen. Ze geven ook de voorkeur aan de actieve snapshot, maar degraderen in plaats van af te breken wanneer een gerichte SecretRef niet beschikbaar is in dat opdrachtpad.

    Alleen-lezen gedrag:

    - Wanneer de gateway draait, lezen deze opdrachten eerst uit de actieve snapshot.
    - Als gateway-resolutie onvolledig is of de gateway niet beschikbaar is, proberen ze een gerichte lokale fallback voor het specifieke opdrachtoppervlak.
    - Als een gerichte SecretRef nog steeds niet beschikbaar is, gaat de opdracht door met gedegradeerde alleen-lezen uitvoer en expliciete diagnostiek zoals "geconfigureerd maar niet beschikbaar in dit opdrachtpad".
    - Dit gedegradeerde gedrag is alleen lokaal voor de opdracht. Het verzwakt runtime-opstart, herladen of verzend-/authenticatiepaden niet.

  </Tab>
</Tabs>

Overige opmerkingen:

- Snapshot-verversing na rotatie van backend-geheimen wordt afgehandeld door `openclaw secrets reload`.
- Gateway-RPC-methode die door deze opdrachtpaden wordt gebruikt: `secrets.resolve`.

## Audit- en configuratieworkflow

Standaard operatorstroom:

<Steps>
  <Step title="Huidige status auditen">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs configureren en toepassen">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Opnieuw auditen">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Behandel de migratie niet als voltooid totdat de nieuwe audit schoon is. Als de audit
nog steeds platte-tekstwaarden in rust rapporteert, is het risico op agenttoegang nog steeds aanwezig,
zelfs wanneer runtime-API's geredigeerde waarden retourneren.

Als je tijdens `configure` een plan opslaat in plaats van het toe te passen, pas dat opgeslagen plan dan
toe met `openclaw secrets apply --from <plan-path>` vóór de nieuwe audit.

<AccordionGroup>
  <Accordion title="secrets audit">
    Bevindingen omvatten:

    - platte-tekstwaarden in rust (`openclaw.json`, `auth-profiles.json`, `.env` en gegenereerde `agents/*/agent/models.json`)
    - resten van gevoelige providerheaders in platte tekst in gegenereerde `models.json`-items
    - onopgeloste verwijzingen
    - overschaduwing door prioriteit (`auth-profiles.json` krijgt prioriteit boven verwijzingen in `openclaw.json`)
    - legacy-resten (`auth.json`, OAuth-herinneringen)

    Opmerking voor exec:

    - Standaard slaat audit controles op oplosbaarheid van exec-SecretRefs over om bijwerkingen van opdrachten te vermijden.
    - Gebruik `openclaw secrets audit --allow-exec` om exec-providers tijdens audit uit te voeren.

    Opmerking over headerresten:

    - Detectie van gevoelige providerheaders is gebaseerd op naamheuristiek (veelvoorkomende auth-/referentiegegevensheadernamen en fragmenten zoals `authorization`, `x-api-key`, `token`, `secret`, `password` en `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Interactieve helper die:

    - eerst `secrets.providers` configureert (`env`/`file`/`exec`, toevoegen/bewerken/verwijderen)
    - je ondersteunde velden met geheimen laat selecteren in `openclaw.json` plus `auth-profiles.json` voor één agentscope
    - direct in de doelkiezer een nieuwe `auth-profiles.json`-mapping kan maken
    - SecretRef-details vastlegt (`source`, `provider`, `id`)
    - preflight-resolutie uitvoert
    - direct kan toepassen

    Opmerking voor exec:

    - Preflight slaat exec-SecretRef-controles over tenzij `--allow-exec` is ingesteld.
    - Als je direct toepast vanuit `configure --apply` en het plan exec-verwijzingen/-providers bevat, houd `--allow-exec` dan ook ingesteld voor de toepasstap.

    Handige modi:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Standaardwaarden voor toepassen met `configure`:

    - bijbehorende statische referentiegegevens uit `auth-profiles.json` opschonen voor gerichte providers
    - legacy statische `api_key`-items uit `auth.json` opschonen
    - bijbehorende bekende geheime regels uit `<config-dir>/.env` opschonen

  </Accordion>
  <Accordion title="secrets apply">
    Een opgeslagen plan toepassen:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Opmerking voor exec:

    - dry-run slaat exec-controles over tenzij `--allow-exec` is ingesteld.
    - schrijfmodus weigert plannen die exec-SecretRefs/-providers bevatten tenzij `--allow-exec` is ingesteld.

    Zie [Contract voor Secrets Apply-plan](/nl/gateway/secrets-plan-contract) voor strikte contractdetails voor doel/pad en exacte weigeringsregels.

  </Accordion>
</AccordionGroup>

## Eenrichtingsveiligheidsbeleid

<Warning>
OpenClaw schrijft bewust geen rollback-back-ups die historische platte-tekstwaarden van geheimen bevatten.
</Warning>

Veiligheidsmodel:

- preflight moet slagen vóór schrijfmodus
- runtime-activering wordt gevalideerd vóór commit
- toepassen werkt bestanden bij met atomische bestandsvervanging en best-effort herstel bij fouten

## Compatibiliteitsopmerkingen voor legacy-authenticatie

Voor statische referentiegegevens is de runtime niet langer afhankelijk van legacy-authenticatieopslag in platte tekst.

- Bron van runtime-referentiegegevens is de opgeloste snapshot in geheugen.
- Legacy statische `api_key`-items worden opgeschoond wanneer ze worden gevonden.
- OAuth-gerelateerd compatibiliteitsgedrag blijft gescheiden.

## Opmerking over de Web-UI

Sommige SecretInput-unies zijn gemakkelijker te configureren in de ruwe-editormodus dan in formuliermodus.

## Gerelateerd

- [Authenticatie](/nl/gateway/authentication) — auth-installatie
- [CLI: secrets](/nl/cli/secrets) — CLI-opdrachten
- [Omgevingsvariabelen](/nl/help/environment) — omgevingsprioriteit
- [SecretRef-oppervlak voor referentiegegevens](/nl/reference/secretref-credential-surface) — oppervlak voor referentiegegevens
- [Contract voor Secrets Apply-plan](/nl/gateway/secrets-plan-contract) — contractdetails voor plannen
- [Beveiliging](/nl/gateway/security) — beveiligingshouding
