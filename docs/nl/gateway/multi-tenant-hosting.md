---
doc-schema-version: 1
read_when:
    - Je host OpenClaw voor meerdere gebruikers of organisaties
    - Je moet een isolatiegrens kiezen voor tenantworkloads
summary: Host meerdere vertrouwensdomeinen van tenants als één geïsoleerde OpenClaw Gateway-cel per tenant
title: Hosting voor meerdere tenants
x-i18n:
    generated_at: "2026-07-16T15:46:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Hosting voor meerdere tenants

Het standaardbeveiligingsmodel van OpenClaw is één vertrouwde operatorgrens per Gateway, niet de isolatie van vijandige tenants binnen één gedeelde Gateway. Het hosten van gebruikers of organisaties die geen vertrouwensgrens delen, betekent daarom dat voor elke tenant een afzonderlijke, volledige OpenClaw-instantie moet worden uitgevoerd.

`openclaw fleet` noemt elke geïsoleerde instantie een **cel**. Een cel is een volledige Gateway in een geharde container met een eigen status, referenties, werkruimte, kanaalaccounts, token en hostpoort die alleen via loopback toegankelijk is.

Fleet is **experimenteel**: de opdrachten, vlaggen en het containerprofiel kunnen tussen releases zonder uitfaseringsperiode worden gewijzigd.

Fleet is getest op Linux- en macOS-hosts. Windows-hosts zijn momenteel niet getest.

## Waarom elke tenant een cel nodig heeft

Een geauthenticeerde operator binnen één Gateway heeft een vertrouwde rol in het besturingsvlak. Sessie-ID's bepalen de routering; ze autoriseren de ene tenant niet ten opzichte van een andere. Agentsandboxing kan de gevolgen van niet-vertrouwde inhoud en tooluitvoering beperken, maar maakt van één gedeelde Gateway geen autorisatiegrens voor tenants.

Gebruik één cel per tenant, zodat elk vertrouwensdomein een afzonderlijk Gateway-proces, een afzonderlijke container, een afzonderlijke persistente statusstructuur en afzonderlijke Gateway-referenties heeft. Dit volgt het [Gateway-beveiligingsmodel](/nl/gateway/security): plaats onderling niet-vertrouwde gebruikers niet samen in één OpenClaw-proces of onder één OS-gebruiker.

## Architectuur

De Fleet CLI is een levenscyclusbeheerder aan de hostzijde. Deze registreert cellen in de statusdatabase van OpenClaw en vraagt een lokale Docker- of Podman-runtime om hun containers te maken, inspecteren, starten, stoppen, vervangen en verwijderen. Externe runtime-eindpunten worden niet ondersteund, omdat de bindpaden en loopback-URL's van Fleet bij de lokale host horen. Fleet proxyt geen tenantberichten en voegt geen gedeeld gegevenspad op applicatieniveau tussen cellen toe.

Elke cel voert de officiële `ghcr.io/openclaw/openclaw`-image uit op een eigen, door de gebruiker gedefinieerd bridgenetwerk. Afzonderlijke bridges voorkomen direct container-IP-verkeer tussen cellen, terwijl uitgaande NAT-toegang voor providers en kanalen behouden blijft. Uitgaand verkeer is standaard onbeperkt. Podman-cellen kunnen `--network internal` gebruiken om uitgaand verkeer te blokkeren en tegelijk de gepubliceerde loopbackpoort van de Gateway te behouden. Interne Docker-netwerken verstoren die gepubliceerde poort, dus Fleet weigert deze combinatie; dwing voor Docker in plaats daarvan beleid voor uitgaand verkeer af met hostfirewallregels, zoals de `DOCKER-USER`-keten. De Gateway van de cel luistert in de container op poort `18789`, terwijl de runtime deze op de host uitsluitend publiceert op `127.0.0.1:<allocated-port>`. Een operator kan een goedgekeurde reverse proxy, SSH-tunnel of tailnet vóór dat loopback-eindpunt plaatsen wanneer externe toegang nodig is.

Persistente Gateway-status is afkomstig van `<state-dir>/fleet/cells/<tenant>/` en wordt gekoppeld aan `/home/node/.openclaw`. Versleutelingssleutels voor authenticatieprofielen zijn afkomstig van het afzonderlijke hostpad `<state-dir>/fleet/auth-profile-secrets/<tenant>/` en worden gekoppeld aan `/home/node/.config/openclaw`, overeenkomstig de officiële [Docker-indeling voor opslag en persistentie](/nl/install/docker#storage-and-persistence). De sleutel bevindt zich niet onder de normale statuskoppeling. Kanaalaccounts per tenant eindigen binnen de cel die ze bezit; Fleet biedt geen gedeeld kanaalaccount of router voor inkomende berichten.

De officiële image gebruikt standaard de niet-rootgebruiker `node` met UID 1000. Fleet gebruikt gebruikerskoppelingen die compatibel zijn met de host, zodat private bind mounts beschrijfbaar blijven: Podman gebruikt `keep-id`, Docker met rootrechten gebruikt de identiteit van de niet-rootgebruiker die de opdracht uitvoert en rootless Docker koppelt container-root aan de onbevoorrechte daemon-gebruiker. Docker en Podman passen een private `:Z`-herlabeling toe wanneer SELinux op de host actief is. Het containerprofiel vermijdt geprivilegieerde hostfuncties en is geschikt voor rootless gebruik, maar rootless werking is een keuze en vereiste van de hostruntime, niet iets wat Fleet automatisch inschakelt.

## Vertrouwensgrens

Multi-tenancy beschermt tenants tegen elkaar. De Fleet-operator en de host worden door elke tenant vertrouwd. Weerstand tegen een gecompromitteerde host is geen doelstelling.

Dit betekent dat een hostbeheerder de containerconfiguratie en -omgeving kan inspecteren, gekoppelde celgegevens kan lezen, images kan vervangen of containers kan binnengaan. Gateway-tokens en waarden die met `--env` worden doorgegeven, zijn via inspectie door Docker of Podman zichtbaar voor een beheerder. Gebruik daarom passende hostmaatregelen, beleid voor beheerderstoegang, bewaking, back-ups en een goedgekeurde geheimenbeheerder.

De basisconfiguratie voorkomt onbedoelde wildcardblootstelling aan het netwerk en verwijdert veelgebruikte mechanismen voor escalatie vanuit containers, maar maakt een niet-vertrouwde host niet veilig.

## Isolatieladder

Kies de grens die past bij de tenants die je host:

1. **Geharde containerbasis.** Fleet verwijdert alle Linux-capabilities, schakelt `no-new-privileges` in, past limieten toe voor PID's, geheugen, CPU en optioneel de schijfruimte van de beschrijfbare laag, gebruikt afzonderlijke persistente koppelingen en netwerken per cel en publiceert uitsluitend naar de loopbackinterface van de host. Bridgenetwerken laten uitgaand verkeer onbeperkt; gebruik `--network internal` van Podman of het hostfirewallbeleid van Docker wanneer een cel geen uitgaande verbindingen mag initiëren. Dit is het standaardprofiel voor tenants die de operator en host vertrouwen.
2. **Sterkere container- of VM-isolatie.** Configureer Docker of Podman voor werkbelastingen met een hoger risico om een sterkere OCI-isolatieruntime te gebruiken, zoals gVisor of Kata Containers, of plaats cellen in micro-VM's. Dit is runtime- of infrastructuurconfiguratie; de optie `--runtime docker|podman` van Fleet kiest de container-CLI, niet de OCI-isolatiebackend. Zie [alternatieve containerruntimes](https://docs.docker.com/engine/daemon/alternative-runtimes/) van Docker en de [handleiding voor de Docker-VM-runtime](/nl/install/docker-vm-runtime).
3. **Afzonderlijke machines voor vijandige tenants.** Plaats vijandige tenants niet samen in één OpenClaw-proces of onder één OS-gebruiker. Wanneer tenants niet dezelfde hostoperator vertrouwen of een sterkere beheergrens nodig hebben, gebruik je afzonderlijke VM's of fysieke hosts met afzonderlijk runtimebeheer.

Geen enkele trede van deze ladder verandert het vertrouwensmodel van de OpenClaw-applicatie: één Gateway blijft één vertrouwd operatordomein.

## Snel aan de slag

Maak een cel. De opdracht toont een gegenereerd Gateway-token één keer, dus sla het onmiddellijk op:

```bash
openclaw fleet create acme
```

Open de gerapporteerde `http://127.0.0.1:<port>`-URL op de Fleet-host, authenticeer met het token van die tenant en configureer providerreferenties en kanaalaccounts binnen de cel.

Controleer de containerstatus en de bereikbaarheid van de Gateway:

```bash
openclaw fleet status acme
```

Voer een upgrade uit met behoud van de hostpoort, gekoppelde gegevens, het resourceprofiel, de door de gebruiker opgegeven omgeving en het Gateway-token:

```bash
openclaw fleet upgrade acme
```

Verwijder de container en registerrij, maar behoud de tenantgegevens:

```bash
openclaw fleet rm acme --force
```

Voeg `--purge-data` toe om ook de persistente tenantgegevens te verwijderen. Volledig wissen vereist `--force`, is onomkeerbaar en voert een insluitingscontrole op het opgeloste pad uit voordat iets wordt verwijderd:

```bash
openclaw fleet rm acme --purge-data --force
```

Zie de [CLI-referentie voor `openclaw fleet`](/cli/fleet) voor alle opdrachten en opties.

## Huidige reikwijdte

Fleet biedt de volgende mogelijkheden niet:

- Gedeelde kanaalaccounts of een gedeelde router voor inkomend verkeer
- Afgeslankte hostprocessen per tenant in plaats van volledige OpenClaw-instanties
- Externe celhosts die door één beheerder worden beheerd
- Een selfserviceportal voor tenants, facturatievlak of gebruikersinterface voor gedelegeerd beheer

Deze mogelijkheden vereisen expliciete contracten voor identiteit, routering, autorisatie en foutdomeinen. Benader ze niet door één Gateway of de bijbehorende referenties tussen tenants te delen. Fleet is een levenscyclusbeheerder voor één host; fleets met meerdere machines en identiteitsgestuurd beheer vereisen een afzonderlijke besturingslaag.

## Gerelateerd

- [`openclaw fleet`](/cli/fleet)
- [Gateway-beveiliging](/nl/gateway/security)
- [Meerdere gateways](/nl/gateway/multiple-gateways)
- [Docker](/nl/install/docker)
- [Podman](/nl/install/podman)
