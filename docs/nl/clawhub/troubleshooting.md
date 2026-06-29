---
read_when:
    - ClawHub CLI- of OpenClaw-registeropdrachten mislukken
    - Een pakket kan niet worden geïnstalleerd, gepubliceerd of bijgewerkt
summary: Problemen met ClawHub-aanmelding, installatie, publicatie, updates en API-kwesties oplossen.
x-i18n:
    generated_at: "2026-06-28T22:32:47Z"
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

- `Retry-After`: seconden wachten voordat je het opnieuw probeert.
- `RateLimit-Limit`: de limiet die op deze aanvraag is toegepast.
- `RateLimit-Remaining`: je exacte resterende budget wanneer de header aanwezig is. Bij `429` is dit `0`.
- `RateLimit-Reset` of `X-RateLimit-Reset`: timing van de reset.

Als veel gebruikers één egress-IP delen, kunnen anonieme IP-limieten worden bereikt, zelfs wanneer elke
persoon maar een paar aanvragen verstuurt. Meld je waar mogelijk aan en probeer het opnieuw na de
gemelde vertraging.

## Zoeken of installeren mislukt achter een proxy

De CLI respecteert standaard proxyvariabelen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Ondersteunde namen zijn onder andere `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` en
`http_proxy`.

## Een Skill verschijnt niet in zoekresultaten

- Controleer de exacte slug of eigenaarspagina als je die kent.
- Bevestig dat de release openbaar is en niet wordt tegengehouden door scan of moderatie.
- Als jij de eigenaar van de Skill bent, meld je dan aan en inspecteer deze:

```bash
clawhub inspect @openclaw/demo
```

Voor de eigenaar zichtbare diagnostiek kan de scan-, upload-gate- of moderatiestatus verklaren.

## Publiceren mislukt omdat vereiste metadata ontbreekt

Controleer voor Skills de frontmatter van `SKILL.md`. Vereiste omgevingsvariabelen en
tools moeten worden gedeclareerd zodat gebruikers en scanners het pakket kunnen begrijpen.

Controleer voor Plugins de compatibiliteitsmetadata in `package.json`. Publicaties van code-Plugins
hebben OpenClaw-compatibiliteitsvelden nodig, zoals `openclaw.compat.pluginApi` en
`openclaw.build.openclawVersion`.

Bekijk eerst een preview van de publicatiepayload:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publiceren mislukt met een GitHub-eigenaar- of bronfout

ClawHub gebruikt GitHub-identiteit en brontoeschrijving om pakketten aan hun
uitgevers te koppelen.

- Zorg dat je bent aangemeld met het GitHub-account dat eigenaar is van het pakket of het kan publiceren.
- Controleer of de bron-URL openbaar is of toegankelijk is voor ClawHub.
- Gebruik voor GitHub-bronnen `owner/repo`, `owner/repo@ref` of een volledige GitHub-URL.

## Publiceren mislukt omdat een namespace is geclaimd of gereserveerd

Als een publicatie mislukt omdat de eigenaarshandle, org-namespace, pakketscope, Skill-
slug of pakketnaam al is geclaimd of gereserveerd, controleer dan eerst of je
publiceert met de eigenaar die overeenkomt met de namespace. Voor Plugin-pakketten
moeten scoped namen zoals `@example-org/example-plugin` worden gepubliceerd als de
overeenkomende eigenaar `example-org`.

Als je denkt dat jouw org, project of merk de rechtmatige namespace-eigenaar is maar
je de huidige ClawHub-eigenaar niet kunt beheren, open dan een
[Org / Namespace Claim-issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
met openbaar, niet-gevoelig bewijs. Zie
[Org- en namespaceclaims](/nl/clawhub/namespace-claims) voor richtlijnen voor bewijs en wat
je buiten openbare issues moet houden.

## `sync` zegt dat er geen Skills zijn gevonden

`sync` zoekt naar mappen die `SKILL.md` of `skill.md` bevatten.

Wijs het naar de roots die je wilt scannen:

```bash
clawhub sync --root /path/to/skills
```

Bekijk eerst een preview als je niet zeker weet wat wordt gepubliceerd:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` weigert vanwege lokale wijzigingen

De lokale bestanden komen niet overeen met een versie die ClawHub kent. Kies één optie:

- Behoud lokale bewerkingen en sla de update over.
- Overschrijf met de gepubliceerde versie:

```bash
clawhub update @openclaw/demo --force
```

- Publiceer je bewerkte kopie als een nieuwe slug of fork.

## Een Plugin-installatie mislukt in OpenClaw

- Gebruik een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

- Controleer de detailpagina van het pakket op scanstatus en compatibiliteitsmetadata.
- Controleer of je OpenClaw-versie voldoet aan het geadverteerde
  compatibiliteitsbereik van het pakket.
- Als het pakket verborgen, tegengehouden of geblokkeerd is, kan het mogelijk niet worden geïnstalleerd totdat
  de eigenaar het probleem oplost.

## Openbare API-aanvragen mislukken

- Respecteer `429` retry-headers en cache openbare lijst-/zoekresponsen.
- Link gebruikers terug naar de canonieke ClawHub-vermelding.
- Spiegel geen verborgen, privé, tegengehouden of door moderatie geblokkeerde content buiten het
  openbare API-oppervlak.

Zie [HTTP API](/nl/clawhub/http-api) voor endpointdetails.
