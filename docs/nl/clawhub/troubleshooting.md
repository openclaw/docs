---
read_when:
    - ClawHub CLI- of OpenClaw-registeropdrachten mislukken
    - Een pakket kan niet worden geïnstalleerd, gepubliceerd of bijgewerkt
summary: Problemen oplossen met aanmelden bij ClawHub, installeren, publiceren, synchroniseren, bijwerken en API-problemen.
x-i18n:
    generated_at: "2026-05-11T20:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Probleemoplossing

## `clawhub login` opent een browser maar voltooit nooit

De CLI start tijdens browseraanmelding een kortlevende lokale callbackserver.

- Zorg dat je browser `http://127.0.0.1:<port>/callback` kan bereiken.
- Controleer lokale firewall-, VPN- en proxyregels als de callback nooit aankomt.
- Maak in headless omgevingen een API-token aan in de ClawHub-web-UI en voer uit:

```bash
clawhub login --token clh_...
```

## `whoami` of `publish` retourneert `Unauthorized` (401)

- Meld je opnieuw aan met `clawhub login`.
- Als je een aangepast configuratiepad gebruikt, controleer dan of `CLAWHUB_CONFIG_PATH` verwijst naar het
  bestand dat je huidige token bevat.
- Als je een API-token gebruikt, controleer dan of het niet is ingetrokken in de web-UI.

## Zoeken of installeren retourneert `Rate limit exceeded` (429)

Lees de retry-informatie in de respons:

- `Retry-After`: seconden om te wachten voordat je het opnieuw probeert.
- `RateLimit-Remaining` en `RateLimit-Limit`: je huidige budget.
- `RateLimit-Reset` of `X-RateLimit-Reset`: resettiming.

Als veel gebruikers één uitgaand IP-adres delen, kunnen anonieme IP-limieten worden bereikt, zelfs wanneer elke
persoon maar een paar verzoeken verstuurt. Meld je waar mogelijk aan en probeer het opnieuw na de
gemelde vertraging.

## Zoeken of installeren mislukt achter een proxy

De CLI respecteert standaard proxyvariabelen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Ondersteunde namen zijn onder andere `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` en
`http_proxy`.

## Een skill verschijnt niet in zoekresultaten

- Controleer de exacte slug of eigenaarspagina als je die weet.
- Controleer of de release openbaar is en niet wordt tegengehouden door scan of moderatie.
- Als jij de skill bezit, meld je aan en inspecteer deze:

```bash
clawhub inspect <skill-slug>
```

Diagnostiek die zichtbaar is voor eigenaars kan de scan-, uploadgate- of moderatiestatus verklaren.

## Publiceren mislukt omdat vereiste metadata ontbreekt

Controleer voor Skills de frontmatter van `SKILL.md`. Vereiste omgevingsvariabelen en
tools moeten worden gedeclareerd zodat gebruikers en scanners het pakket kunnen begrijpen.

Controleer voor plugins de compatibiliteitsmetadata in `package.json`. Publicaties van code-plugins
hebben OpenClaw-compatibiliteitsvelden nodig, zoals `openclaw.compat.pluginApi` en
`openclaw.build.openclawVersion`.

Bekijk eerst een preview van de publicatiepayload:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publiceren mislukt met een GitHub-eigenaar- of bronfout

ClawHub gebruikt GitHub-identiteit en brontoeschrijving om pakketten aan hun
uitgevers te koppelen.

- Zorg dat je bent aangemeld met het GitHub-account dat eigenaar is van het pakket of het mag publiceren.
- Controleer of de bron-URL openbaar is of toegankelijk is voor ClawHub.
- Gebruik voor GitHub-bronnen `owner/repo`, `owner/repo@ref` of een volledige GitHub-URL.

## `sync` zegt dat er geen Skills zijn gevonden

`sync` zoekt naar mappen die `SKILL.md` of `skill.md` bevatten.

Wijs het naar de roots die je wilt scannen:

```bash
clawhub sync --root /path/to/skills
```

Bekijk eerst een preview als je niet zeker weet wat er wordt gepubliceerd:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` weigert vanwege lokale wijzigingen

De lokale bestanden komen niet overeen met een versie die ClawHub kent. Kies een optie:

- Bewaar lokale bewerkingen en sla de update over.
- Overschrijf met de gepubliceerde versie:

```bash
clawhub update <slug> --force
```

- Publiceer je bewerkte kopie als een nieuwe slug of fork.

## Een plugininstallatie mislukt in OpenClaw

- Gebruik een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

- Controleer de pakketdetailpagina op scanstatus en compatibiliteitsmetadata.
- Controleer of je OpenClaw-versie voldoet aan het geadverteerde
  compatibiliteitsbereik van het pakket.
- Als het pakket verborgen, tegengehouden of geblokkeerd is, is het mogelijk niet installeerbaar totdat
  de eigenaar het probleem oplost.

## Openbare API-verzoeken mislukken

- Respecteer `429`-retryheaders en cache openbare lijst-/zoekresponsen.
- Verwijs gebruikers terug naar de canonieke ClawHub-vermelding.
- Spiegel geen verborgen, private, tegengehouden of door moderatie geblokkeerde inhoud buiten het
  openbare API-oppervlak.

Zie [HTTP API](/nl/clawhub/http-api) voor endpointdetails.
