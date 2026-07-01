---
read_when:
    - ClawHub CLI- of OpenClaw-registeropdrachten mislukken
    - Een pakket kan niet worden geïnstalleerd, gepubliceerd of bijgewerkt
summary: Problemen oplossen met aanmelden bij ClawHub, installatie, publicatie, updates en API-problemen.
x-i18n:
    generated_at: "2026-07-01T20:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Probleemoplossing

## `clawhub login` opent een browser maar wordt nooit voltooid

De CLI start tijdens browserlogin een kortlevende lokale callbackserver.

- Zorg dat je browser `http://127.0.0.1:<port>/callback` kan bereiken.
- Controleer lokale firewall-, VPN- en proxyregels als de callback nooit aankomt.
- Maak in headless omgevingen een API-token aan in de ClawHub-webinterface en voer uit:

```bash
clawhub login --token clh_...
```

## `whoami` of `publish` geeft `Unauthorized` (401) terug

- Meld je opnieuw aan met `clawhub login`.
- Als je een aangepast configuratiepad gebruikt, bevestig dan dat `CLAWHUB_CONFIG_PATH` verwijst naar het
  bestand dat je huidige token bevat.
- Als je een API-token gebruikt, bevestig dan dat het niet is ingetrokken in de webinterface.

## Zoeken of installeren geeft `Rate limit exceeded` (429) terug

Lees de retry-informatie in de respons:

- `Retry-After`: seconden om te wachten voordat je het opnieuw probeert.
- `RateLimit-Limit`: de limiet die op dit verzoek is toegepast.
- `RateLimit-Remaining`: je exacte resterende budget wanneer de header aanwezig is. Bij `429` is dit `0`.
- `RateLimit-Reset` of `X-RateLimit-Reset`: reset-timing.

Als veel gebruikers één uitgaand IP-adres delen, kunnen anonieme IP-limieten worden bereikt, zelfs wanneer elke
persoon slechts enkele verzoeken verstuurt. Meld je waar mogelijk aan en probeer het opnieuw na de
gemelde vertraging.

## Zoeken of installeren mislukt achter een proxy

De CLI respecteert standaard proxyvariabelen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Ondersteunde namen zijn onder meer `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` en
`http_proxy`.

## Een skill verschijnt niet in de zoekresultaten

- Controleer de exacte slug of eigenaarspagina als je die kent.
- Bevestig dat de release openbaar is en niet wordt tegengehouden door scan of moderatie.
- Als je eigenaar bent van de skill, meld je aan en inspecteer deze:

```bash
clawhub inspect @openclaw/demo
```

Diagnostiek die zichtbaar is voor de eigenaar kan de scan-, upload-gate- of moderatiestatus verklaren.

## Publiceren mislukt omdat vereiste metadata ontbreekt

Controleer voor Skills de frontmatter van `SKILL.md`. Vereiste omgevingsvariabelen en
tools moeten worden gedeclareerd zodat gebruikers en scanners het pakket kunnen begrijpen.

Controleer voor plugins de compatibiliteitsmetadata in `package.json`. Publicaties van code-plugins
hebben OpenClaw-compatibiliteitsvelden nodig, zoals `openclaw.compat.pluginApi` en
`openclaw.build.openclawVersion`.

Bekijk eerst een voorbeeld van de publicatiepayload:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publiceren mislukt met een GitHub-eigenaar- of bronfout

ClawHub gebruikt GitHub-identiteit en brontoewijzing om pakketten te koppelen aan hun
uitgevers.

- Zorg dat je bent aangemeld met het GitHub-account dat eigenaar is van het pakket of het kan publiceren.
- Controleer dat de bron-URL openbaar is of toegankelijk is voor ClawHub.
- Gebruik voor GitHub-bronnen `owner/repo`, `owner/repo@ref` of een volledige GitHub-URL.

## Publiceren mislukt omdat een namespace is geclaimd of gereserveerd

Als publiceren mislukt omdat de eigenaarhandle, org-namespace, pakketscope, skill-
slug of pakketnaam al is geclaimd of gereserveerd, bevestig dan eerst dat je
publiceert met de eigenaar die overeenkomt met de namespace. Voor pluginpakketten
moeten scoped namen zoals `@example-org/example-plugin` worden gepubliceerd als de
overeenkomende eigenaar `example-org`.

Als je denkt dat je org, project of merk de rechtmatige eigenaar van de namespace is, maar
je de huidige ClawHub-eigenaar niet kunt beheren, open dan een
[Org / Namespace Claim-issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
met openbaar, niet-gevoelig bewijs. Zie
[Org- en namespaceclaims](/clawhub/namespace-claims) voor bewijsrichtlijnen en wat
je buiten openbare issues moet houden.

## `sync` zegt dat er geen Skills zijn gevonden

`sync` zoekt naar mappen met `SKILL.md` of `skill.md`.

Richt het op de roots die je wilt scannen:

```bash
clawhub sync --root /path/to/skills
```

Bekijk eerst een voorbeeld als je niet zeker weet wat er wordt gepubliceerd:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` weigert vanwege lokale wijzigingen

De lokale bestanden komen niet overeen met een versie die ClawHub kent. Kies een optie:

- Bewaar lokale bewerkingen en sla de update over.
- Overschrijf met de gepubliceerde versie:

```bash
clawhub update @openclaw/demo --force
```

- Publiceer je bewerkte kopie als een nieuwe slug of fork.

## Installatie van een plugin mislukt in OpenClaw

- Gebruik een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

- Controleer de detailpagina van het pakket voor scanstatus en compatibiliteitsmetadata.
- Bevestig dat je OpenClaw-versie voldoet aan het geadverteerde
  compatibiliteitsbereik van het pakket.
- Als het pakket verborgen, tegengehouden of geblokkeerd is, kan het mogelijk niet worden geïnstalleerd totdat
  de eigenaar het probleem oplost.

## Openbare API-verzoeken mislukken

- Respecteer `429` retry-headers en cache openbare lijst-/zoekresponses.
- Link gebruikers terug naar de canonieke ClawHub-vermelding.
- Mirror geen verborgen, privé-, tegengehouden of door moderatie geblokkeerde inhoud buiten het
  openbare API-oppervlak.

Zie [HTTP API](/clawhub/http-api) voor endpointdetails.
