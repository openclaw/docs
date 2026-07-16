---
read_when:
    - Je host meerdere vertrouwensdomeinen van tenants op één machine
    - Je moet vlootcellen maken, inspecteren, upgraden of verwijderen
summary: CLI-referentie voor het inrichten en beheren van geïsoleerde OpenClaw-cellen per tenant
title: Vloot
x-i18n:
    generated_at: "2026-07-16T15:35:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` beheert volledige OpenClaw-instanties die **cellen** worden genoemd. Elke cel heeft een eigen Gateway, status, inloggegevens, kanaalaccounts, container en hostpoort die alleen via loopback bereikbaar is. Gebruik één cel per vertrouwensgrens van een tenant; gebruik niet één gedeelde Gateway als grens tussen vijandige tenants.

Fleet is **experimenteel**. Namen van opdrachten, vlaggen, uitvoerstructuren en het containerprofiel kunnen zonder afschrijvingsperiode tussen releases veranderen.

Fleet ondersteunt Docker en Podman. De standaardimage is `ghcr.io/openclaw/openclaw:latest`.

Fleet is getest op Linux- en macOS-hosts. Windows-hosts zijn momenteel niet getest.

## Snel aan de slag

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` toont het gegenereerde Gateway-token eenmalig samen met de URL van de cel. Sla het token onmiddellijk op en configureer vervolgens de kanaalaccounts van elke tenant in de cel van die tenant.

## Tenant-ID's

Tenant-ID's moeten overeenkomen met:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Hiermee zijn 1 tot 40 kleine letters, cijfers en interne koppeltekens toegestaan. Een ID moet met een letter of cijfer beginnen en eindigen. Hoofdletters, underscores, schuine strepen, punten, witruimte en padtraversalreeksen zoals `../acme` worden geweigerd.

De ID wordt onderdeel van de containernaam: `openclaw-cell-<tenant>`.

## `fleet create`

Maak een cel en start deze:

```bash
openclaw fleet create acme
```

Maak een Podman-cel op een vaste poort zonder deze te starten:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Geef tenantspecifieke omgevingsvariabelen door door `--env` te herhalen:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

Omgevingssleutels gebruiken letters, cijfers en underscores en mogen niet met een cijfer beginnen. Waarden moeten uit één regel bestaan, omdat Fleet ze doorgeeft via een beveiligd omgevingsbestand van de runtime. Fleet weigert pogingen om de beheerde variabelen voor containerpaden en Gateway-tokens te overschrijven die onder [Opslag- en containerindeling](#storage-and-container-layout) worden vermeld.

### Aanmaakopties

| Optie                     | Standaard                              | Beschrijving                                                                                  |
| ------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--image <ref>`        | `ghcr.io/openclaw/openclaw:latest`                     | Containerimage voor de cel.                                                                   |
| `--runtime <runtime>`        | `docker`                     | Container-CLI: `docker` of `podman`.                                      |
| `--port <number>`        | Automatisch toegewezen vanaf `19100` | Loopback-hostpoort. Een expliciet geselecteerde poort mag niet bij een andere geregistreerde cel horen. |
| `--memory <value>`        | `2g`                     | Geheugenlimiet voor de container in Docker-/Podman-syntaxis.                                  |
| `--cpus <value>`        | `2`                     | CPU-limiet voor de container.                                                                  |
| `--disk <size>`        | Geen                                   | Beperk de beschrijfbare laag van de container wanneer de opslagbackend quota ondersteunt.     |
| `--network <mode>`        | `bridge`                     | Modus voor uitgaand netwerkverkeer: `bridge` of `internal`.                  |
| `--pids-limit <number>`        | `512`                     | Maximaal aantal processen in de container.                                                     |
| `--env <KEY=VALUE>`        | Geen                                   | Geef een omgevingsvariabele door aan de cel. Herhaal dit voor meerdere waarden.                |
| `--gateway-token <value>`        | Willekeurig hexadecimaal token van 32 tekens | Gebruik een opgegeven Gateway-token in plaats van er een te genereren. Zie [Tokenverwerking](#token-handling). |
| `--no-start`        | Cel wordt gestart                      | Maak de container zonder deze te starten.                                                      |
| `--json`        | Voor mensen leesbare uitvoer           | Toon machineleesbare uitvoer.                                                                  |

Bij automatische toewijzing wordt de eerste ongebruikte registerpoort op of boven `19100` geselecteerd. Fleet weigert dubbele tenant-ID's en expliciete poorten die al aan een andere cel zijn toegewezen.

Imageverwijzingen worden als één argument aan de containerruntime doorgegeven. Lege verwijzingen en waarden die met `-` beginnen, worden geweigerd, zodat een image niet als een Docker- of Podman-optie kan worden geïnterpreteerd.

Het geselecteerde Docker- of Podman-eindpunt moet lokaal zijn. Fleet weigert externe Docker-contexten, `DOCKER_HOST`-eindpunten en externe Podman-services voordat een poort wordt gereserveerd of lokale status wordt aangemaakt. Externe celhosts worden niet ondersteund.

Wanneer Fleet een nieuwe cel start, wacht de aanmaakopdracht maximaal ongeveer een minuut totdat de Gateway op `/healthz` reageert. Als de cel niet gezond wordt, laat Fleet de container en registerrij intact voor `fleet status`, `fleet logs` of expliciete verwijdering. `--no-start` slaat deze gezondheidscontrole over. Het gegenereerde Gateway-token van een ongezonde nieuwe cel gaat niet verloren: het blijft in de containeromgeving (`docker|podman inspect`) en omdat de cel nog geen verkeer heeft verwerkt, is `fleet rm --force` gevolgd door een nieuwe aanmaakopdracht altijd een veilig alternatief.

### Vastzetten op digest

De aanmaak- en upgradeopdrachten accepteren op digest vastgezette imageverwijzingen, zoals `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet geeft de imageverwijzing ongewijzigd door aan Docker of Podman, zodat een beheerder een cel op onveranderlijke imagebytes kan houden in plaats van op een veranderende tag.

Het aanmaakresultaat bevat de tenant-ID, containernaam, hostpoort, het Gateway-token en de lokale URL. Behandel het resultaat ook bij JSON-uitvoer als geheimhoudingsplichtig, omdat het token erin staat.

### Schijflimieten

`--disk` beperkt alleen de beschrijfbare laag van de container. De via bind-mount gekoppelde status- en authenticatiemappen per tenant blijven hostopslag; gebruik projectquota van het hostbestandssysteem wanneer ook voor deze mappen een harde limiet nodig is.

| Runtime/opslagbackend    | Ondersteuning voor `--disk`                                  |
| ------------------------ | ----------------------------------------------------------------------- |
| Docker overlay2 op XFS   | Vereist de XFS-mountoptie `pquota`.                           |
| Docker btrfs of zfs      | Wordt ondersteund door het opslagstuurprogramma.                        |
| Podman overlay           | Vereist XFS als onderliggende opslag.                                   |
| Andere backends          | Het aanmaken van de container mislukt met de daemonfout en backendrichtlijnen van Fleet. |

### Beleid voor uitgaand verkeer

| Modus                | Docker                                                                                                 | Podman                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `bridge`   | Ondersteund; uitgaand verkeer is standaard onbeperkt.                                                   | Ondersteund; uitgaand verkeer is standaard onbeperkt.                                         |
| `internal`   | Geweigerd omdat Docker de gepubliceerde loopbackpoort van de Gateway niet behoudt op een intern netwerk. | Ondersteund; de loopback-Gateway blijft gepubliceerd terwijl uitgaand verkeer wordt geblokkeerd. |

Behoud voor Docker de bridge-modus en dwing het beleid voor uitgaand verkeer af met firewallregels op de host, zoals de `DOCKER-USER`-keten.

## `fleet list`

Toon cellen in volgorde van tenant-ID:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

De tabel bevat:

| Kolom                  | Betekenis                                                                                                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`     | Tenant-ID.                                                                                                                                                                                                                                                                             |
| `state`     | Actuele containerstatus uit inspectie door Docker of Podman. `unknown` betekent dat de runtime niet beschikbaar was, of dat er een container met de naam van de cel bestaat waarvan de Fleet-eigendomlabels niet overeenkomen met de registervermelding (een signaal van een botsing of manipulatie — inspecteer deze handmatig voordat je actie onderneemt). |
| `port`     | Loopback-hostpoort die aan de Gateway van de cel is gekoppeld.                                                                                                                                                                                                                          |
| `image`     | Vastgelegde containerimage.                                                                                                                                                                                                                                                             |
| `created`     | Aanmaaktijd van de cel.                                                                                                                                                                                                                                                                 |

Registerrijen blijven zichtbaar wanneer Docker of Podman niet beschikbaar is; alleen de actuele status wordt dan `unknown`.

## `fleet status`

Inspecteer één cel:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

De status combineert de registerrij van Fleet, actuele containerinspectie en een kort verzoek op basis van beste inspanning aan:

```text
http://127.0.0.1:<host-port>/healthz
```

Het gezondheidsresultaat is `ok`, `failed` of `skipped`. `/healthz` bewijst dat de Gateway actief is, niet dat elk geconfigureerd kanaal of elke Plugin volledig gereed is. De controle wordt overgeslagen wanneer er geen bruikbaar lokaal eindpunt beschikbaar is om te controleren.

## `fleet logs`

Stream de containerlogs van een cel rechtstreeks naar de terminal:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet controleert de eigendomlabels van de geregistreerde container voordat logs worden gelezen en weigert daarom een vreemde container die de verwachte celnaam gebruikt. De stream wordt vastgezet op de ID van de geïnspecteerde container, zodat een gelijktijdige vervanging deze niet naar een nieuwere generatie kan omleiden. Druk op Ctrl-C om `--follow` te beëindigen zonder dat de stopactie van de beheerder als een opdrachtfout wordt behandeld. Loguitvoer wordt door een redactiefilter geleid dat het huidige Gateway-token van de cel vervangt door `<redacted>` voordat iets de terminal bereikt.

`fleet logs` heeft geen `--json`-modus, omdat containerlogs een onbewerkte stdout/stderr-stream zijn. Beperk voor scripts de uitvoer met `--tail` en gebruik normale shellomleiding of pipelines.

## `fleet start`, `fleet stop` en `fleet restart`

Beheer een bestaande cel met de geregistreerde runtime:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Deze opdrachten werken met de geregistreerde containernaam. Ze mislukken als de tenant onbekend is of als de geregistreerde runtime de bewerking niet kan uitvoeren.

## `fleet upgrade`

Haal de geregistreerde image opnieuw op en vervang de celcontainer:

```bash
openclaw fleet upgrade acme
```

Verplaats de cel naar een andere image:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

Upgrade haalt de doelimage op, inspecteert de bestaande container en het netwerk per cel, stopt en verwijdert de container en maakt en start deze vervolgens opnieuw. De vervanging behoudt dezelfde hostpoort, gegevensmappen, hetzelfde bridgenetwerk per cel, runtimeprofiel, resourcelimieten, herstartbeleid, dezelfde door Fleet beheerde omgeving en de waarden die oorspronkelijk met `--env` zijn opgegeven. Gekoppelde status blijft behouden bij vervanging van de container; de standaardomgeving van de image kan met de doelimage veranderen.

De vervanging wordt pas definitief gemaakt nadat de Gateway op de loopbackpoort van de cel reageert op `/healthz`, overeenkomstig het statuscontract dat het officiële compose-bestand gebruikt. Een vervanging die wordt afgesloten, in een crashlus terechtkomt of niet binnen ongeveer een minuut gezond wordt, wordt verwijderd en de vorige container wordt hersteld, zodat een defecte image een werkende cel niet buiten werking stelt.

Het Gateway-token wordt bewust niet in het Fleet-register opgeslagen. Voordat de oude container wordt verwijderd, leest Fleet de omgeving ervan en neemt `OPENCLAW_GATEWAY_TOKEN` over in de vervanging. Verwijder de oude container vóór een upgrade niet handmatig als het token nergens anders onder jouw beheer bestaat.

## `fleet backup` en `fleet restore`

Maak een back-up van één gestopte cel:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Herstel dat archief naar de geregistreerde cel:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Dit zijn opdrachten met hostoperatorbevoegdheden. Archieven bevatten tenantstatus en authenticatiegeheimen, worden aangemaakt met modus `0600` en moeten als aanmeldgegevens worden opgeslagen. Back-up weigert een actieve cel, zodat de SQLite-status consistent wordt vastgelegd. Herstellen weigert een actieve cel tenzij `--force` is opgegeven, vervangt alleen de status van die tenant, roteert het Gateway-token en geeft het nieuwe token eenmaal weer. Fleet maakt van één tenant tegelijk een back-up; een back-up van alle tenants is een afzonderlijke operatoractie.

Voor herstel is een bestaande gestopte container nodig, omdat het geïnspecteerde runtimeprofiel daarvan de vervangende limieten, gebruikerstoewijzing, herkomst van de omgeving en image levert. Als de geregistreerde container buiten Fleet om is verwijderd, voer dan eerst `fleet rm <tenant> --force` uit zonder `--purge-data`, maak de cel opnieuw aan met de gewenste image en `--no-start` en probeer het herstel vervolgens opnieuw. Bij de eerste verwijdering blijven beide tenantgegevensmappen intact.

Beide opdrachten accepteren `--max-bytes <bytes>` om de hoeveelheid gearchiveerde of uitgepakte bestandsgegevens te begrenzen, en beide passen hetzelfde vaste budget van één miljoen archiefpadsegmenten toe, zodat archiefbommen die alleen uit metadata bestaan de inodes van de host niet kunnen uitputten en elke geaccepteerde back-up herstelbaar blijft. Back-up accepteert `--out <path>` en beide opdrachten ondersteunen `--json`.

Archieven bevatten uitsluitend gewone bestanden en mappen. Back-up volgt of bewaart nooit symbolische koppelingen, harde koppelingen, sockets of apparaatknooppunten; aantallen overgeslagen items worden in het resultaat vermeld. Herstellen weigert archieven die een ander type item bevatten. Opnieuw aanmaakbare bomen met symbolische koppelingen, zoals `node_modules` van de werkruimte, moeten na een herstel opnieuw in de cel worden geïnstalleerd.

## `fleet doctor`

Controleer elke cel of één tenant zonder de runtime- of bestandssysteemstatus te wijzigen:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor controleert de lokaliteit van de runtime, eigendomslabels, status, beveiliging, resourcelimieten, binding aan de loopbackpoort, aanwezigheid van het token, netwerkeigendom en de uitgaande-verbindingsmodus, en machtigingen voor privémappen met statusgegevens. Waarschuwingen beschrijven gestopte cellen of verschillen in eigendom; elke mislukte bevinding stelt een procesafsluitcode anders dan nul in.

## `fleet rm`

Verwijder een gestopte cel uit de runtime en het register, maar behoud de tenantgegevens:

```bash
openclaw fleet rm acme
```

Voor een actieve container is `--force` vereist:

```bash
openclaw fleet rm acme --force
```

Verwijder ook de celgegevens permanent:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet verwijdert de celcontainer voordat het toegewezen bridgenetwerk wordt verwijderd. `--purge-data` vereist `--force`. Vóór recursieve verwijdering herleidt Fleet zowel de twee basismappen die eigendom zijn van Fleet als de twee mappen per tenant. Elk doel moet exact het verwachte tenantblad zijn, zich strikt binnen de basismap bevinden en mag geen symbolische koppeling zijn. Deze insluitingscontroles voorkomen dat een beschadigd registerpad of een symbolische koppeling tussen tenants de verwijdering naar een andere locatie omleidt.

Opschonen kan opnieuw worden geprobeerd als een exact verwachte tenantmap al ontbreekt. Hierdoor kan een latere aanroep de opschoning na een gedeeltelijke bestandssysteemfout voltooien zonder de padcontroles te versoepelen voor mappen die nog bestaan.

## Opslag- en containerindeling

De celstatus en versleutelingssleutels voor authenticatieprofielen gebruiken afzonderlijke hostpaden per tenant onder de actieve OpenClaw-statusmap:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

De eerste map wordt gekoppeld aan `/home/node/.openclaw`. De tweede wordt gekoppeld aan `/home/node/.config/openclaw`, overeenkomstig de koppeling van de versleutelingssleutel in de officiële Docker-configuratie. De versleutelingssleutel wordt daardoor niet onder de gewone statuskoppeling beschikbaar gemaakt en wordt niet opgenomen wanneer alleen de celstatusmap wordt geback-upt of gedeeld. Beide mappen blijven behouden bij normale verwijdering en upgrades; `fleet rm --purge-data --force` verwijdert beide na afzonderlijke insluitingscontroles.

Vóór de eerste start initialiseert Fleet de celconfiguratie met `gateway.mode=local`, tokenauthenticatie, de LAN-containerbinding en Control UI-oorsprongen voor de toegewezen hostpoort. De tokenwaarde wordt niet naar die configuratie geschreven; deze blijft in de containeromgeving.

Fleet zet de containerpaden van de officiële image vast met deze omgevingswaarden:

| Variabele                 | Containerwaarde                      |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Gegenereerd of opgegeven celtoken     |

De officiële image gebruikt standaard de niet-rootgebruiker `node` met UID 1000. Fleet houdt de privé-bindmounts van `0700` beschrijfbaar zonder ze voor iedereen toegankelijk te maken. Rootful Docker voert de cel uit met de UID en GID van de niet-rootgebruiker die de opdracht aanroept; rootless Docker gebruikt container-UID 0, die binnen de gebruikersnaamruimte van de daemon wordt toegewezen aan de niet-bevoorrechte hostgebruiker die de opdracht aanroept. Podman gebruikt `keep-id` met de aanroepende UID en GID. Wanneer Fleet zelf als root wordt uitgevoerd met een rootful runtime, behoudt het de imagegebruiker en wijst het de oorspronkelijke mountbestanden toe aan UID/GID 1000.

Op SELinux-hosts krijgen Docker- en Podman-mounts een privé-herlabeling met `:Z`. Als je celgegevens herstelt of verplaatst, zorg dan dat de bindmountpaden beschrijfbaar blijven voor de effectieve containergebruiker. Het profiel is geschikt voor rootless gebruik, maar Docker of Podman moet al voor rootless werking op de host zijn geconfigureerd; Fleet zet een rootful daemon niet om in een rootless daemon.

## Beveiligingsprofiel

Fleet past het volgende profiel toe op elke cel:

| Maatregel              | Toegepast profiel                                      | Reden                                                                                    |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Linux-mogelijkheden   | `--cap-drop=ALL`                                     | De Gateway is een Node.js-proces en heeft geen aanvullende Linux-mogelijkheden nodig.                |
| Privilegeverhoging | `--security-opt no-new-privileges`                   | Voorkomt dat processen bevoegdheden verkrijgen via setuid- of setgid-programma's.          |
| Init-proces         | `--init`                                             | Ruimt onderliggende processen op en stuurt levenscyclussignalen van de container door.                   |
| Proceslimiet        | Standaard `--pids-limit 512`                        | Begrenst uitputting door forks en processen.                                                    |
| Geheugenlimiet         | Standaard `--memory 2g`                             | Begrenst het geheugengebruik van de cel.                                                                |
| CPU-limiet            | Standaard `--cpus 2`                                | Begrenst het CPU-gebruik van de cel.                                                                   |
| Schijfruimte van beschrijfbare laag  | Optioneel `--disk`                                    | Begrenst de containerlaag wanneer de opslagbackend van de runtime quota ondersteunt.           |
| Herstartbeleid       | `--restart unless-stopped`                           | Herstart een mislukte cel zonder een opzettelijke stop te negeren.                         |
| Publicatie op host      | Alleen `127.0.0.1:<host-port>:18789`                   | Houdt de Gateway weg van wildcard-hostinterfaces.                                        |
| Celnetwerk         | Eén bridge- of intern Podman-netwerk per cel       | Scheidt container-IP-verkeer en blokkeert optioneel uitgaand Podman-verkeer.           |
| Containeridentiteit   | Aan de host aangepaste gebruikerstoewijzing                            | Houdt privé-bindmounts beschrijfbaar zonder iedereen toegang te verlenen.                      |
| Permanente status     | Mounts per cel; geen gedeelde statusmount               | Houdt tenantconfiguratie, aanmeldgegevens, sessies en werkruimten in de gegevensstructuur van die tenant. |
| Containeropdracht    | `node dist/index.js gateway --bind lan --port 18789` | Luistert op het containernetwerk zodat de uitsluitend aan loopback gekoppelde hostpoort deze kan bereiken.  |

Fleet koppelt nooit `/var/run/docker.sock`, gebruikt nooit `--privileged` of hostnetwerken en voegt geen mogelijkheden toe. De bridge per cel is een scheidingsgrens tussen cellen, geen uitgaande firewall: cellen behouden de netwerktoegang die nodig is voor providers en kanalen. Plaats vóór de loopbackpoort een proxy, SSH-tunnel of tailnetconfiguratie die bij je implementatie past. `http://127.0.0.1:<port>` is alleen rechtstreeks bereikbaar vanaf de Fleet-host.

Dit profiel scheidt tenantcontainers, maar beschermt tenants niet tegen de Fleet-operator, de beheerder van de containerruntime of een gecompromitteerde host. Zie [Hosting voor meerdere tenants](/gateway/multi-tenant-hosting) voor het volledige vertrouwensmodel en sterkere isolatieopties.

## Tokenverwerking

Standaard genereert `fleet create` een cryptografisch willekeurig hexadecimaal Gateway-token van 32 tekens en geeft het eenmaal weer in het aanmaakresultaat. Bewaar het in je goedgekeurde geheimenbeheerder en voorkom dat aanmaakuitvoer in logboeken wordt vastgelegd.

`--gateway-token` plaatst een aangepast token in de argumenten van het lokale proces, die in de shellgeschiedenis kunnen worden bewaard of zichtbaar kunnen zijn in proceslijsten. Gebruik bij voorkeur het gegenereerde token, tenzij een bestaande workflow voor geheimenbeheer een opgegeven waarde vereist.

Het token en elke waarde die met `--env` wordt doorgegeven, bevinden zich in de containeromgeving. Fleet schrijft ze naar een kortlevend omgevingsbestand met modus `0600`, geeft alleen het pad van dat bestand door aan Docker of Podman en verwijdert het nadat de runtimeopdracht is voltooid. Waarden die expliciet in `openclaw fleet create --gateway-token ...` of `--env KEY=VALUE` worden getypt, kunnen nog steeds zichtbaar zijn in de argumenten van het buitenste `openclaw`-proces en in de shellgeschiedenis.

Omgevingswaarden van containers zijn niet verborgen voor de vertrouwde hostbeheerder: Docker- of Podman-beheerders kunnen ze uitlezen via containerinspectie. De opmerking ‘eenmalig weergegeven’ van Fleet beschrijft de normale CLI-uitvoer, niet de bescherming tegen een hostbeheerder.

## Gerelateerd

- [Hosting voor meerdere tenants](/gateway/multi-tenant-hosting)
- [Docker](/nl/install/docker)
- [Podman](/nl/install/podman)
- [Gateway-beveiliging](/nl/gateway/security)
