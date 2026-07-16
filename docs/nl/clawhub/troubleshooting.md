---
read_when:
    - ClawHub CLI- of OpenClaw-registeropdrachten mislukken
    - Een pakket kan niet worden geïnstalleerd, gepubliceerd of bijgewerkt
summary: Problemen oplossen met aanmelden bij ClawHub, installeren, publiceren, bijwerken en de API.
x-i18n:
    generated_at: "2026-07-16T15:22:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Problemen oplossen

## `clawhub login` opent een browser, maar wordt nooit voltooid

De CLI start tijdens het aanmelden via de browser een lokale callbackserver met een korte levensduur.

- Zorg ervoor dat je browser `http://127.0.0.1:<port>/callback` kan bereiken.
- Controleer de lokale firewall-, VPN- en proxyregels als de callback nooit aankomt.
- Maak in headless omgevingen een API-token aan in de ClawHub-webinterface en voer het volgende uit:

```bash
clawhub login --token clh_...
```

## `whoami` of `publish` retourneert `Unauthorized` (401)

- Meld je opnieuw aan met `clawhub login`.
- Als je een aangepast configuratiepad gebruikt, controleer dan of `CLAWHUB_CONFIG_PATH` verwijst naar het
  bestand dat je huidige token bevat.
- Als je een API-token gebruikt, controleer dan of dit niet is ingetrokken in de webinterface.

## Zoeken of installeren retourneert `Rate limit exceeded` (429)

Lees de informatie over opnieuw proberen in het antwoord:

- `Retry-After`: het aantal seconden dat je moet wachten voordat je het opnieuw probeert.
- `RateLimit-Limit`: de limiet die op deze aanvraag is toegepast.
- `RateLimit-Remaining`: je exacte resterende quotum wanneer de header aanwezig is. Bij `429` is dit `0`.
- `RateLimit-Reset` of `X-RateLimit-Reset`: het tijdstip waarop de limiet wordt gereset.

Als veel gebruikers één uitgaand IP-adres delen, kunnen anonieme IP-limieten worden bereikt, zelfs wanneer elke
persoon slechts enkele aanvragen verzendt. Meld je waar mogelijk aan en probeer het opnieuw na de
vermelde wachttijd.

## Zoeken of installeren mislukt achter een proxy

De CLI respecteert standaard proxyvariabelen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Ondersteunde namen zijn onder meer `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` en
`http_proxy`.

## Een skill verschijnt niet in de zoekresultaten

- Controleer de exacte slug of eigenaars­pagina als je die kent.
- Controleer of de release openbaar is en niet wordt tegengehouden door een scan of moderatie.
- Als je eigenaar bent van de skill, meld je dan aan en inspecteer deze:

```bash
clawhub inspect @openclaw/demo
```

Diagnostische gegevens die zichtbaar zijn voor de eigenaar kunnen de status van de scan, uploadpoort of moderatie verklaren.

## Publiceren mislukt omdat vereiste metagegevens ontbreken

Controleer voor skills de frontmatter van `SKILL.md`. Vereiste omgevingsvariabelen en
hulpprogramma's moeten worden gedeclareerd, zodat gebruikers en scanners het pakket kunnen begrijpen.

Controleer voor plugins de compatibiliteitsmetagegevens van `package.json`. Voor het publiceren van codeplugins
zijn OpenClaw-compatibiliteitsvelden vereist, zoals `openclaw.compat.pluginApi` en
`openclaw.build.openclawVersion`.

Bekijk eerst een voorbeeld van de publicatiepayload:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publiceren mislukt door een fout met de GitHub-eigenaar of -bron

ClawHub gebruikt de GitHub-identiteit en bronvermelding om pakketten aan hun
uitgevers te koppelen.

- Zorg ervoor dat je bent aangemeld met het GitHub-account dat eigenaar is van het pakket of het kan publiceren.
- Controleer of de bron-URL openbaar of toegankelijk voor ClawHub is.
- Gebruik voor GitHub-bronnen `owner/repo`, `owner/repo@ref` of een volledige GitHub-URL.

## Publiceren mislukt omdat een naamruimte geclaimd of gereserveerd is

Als publiceren mislukt omdat de eigenaarshandle, organisatienaamruimte, pakketscope, skill-
slug of pakketnaam al geclaimd of gereserveerd is, controleer dan eerst of je
publiceert met de eigenaar die bij de naamruimte hoort. Voor pluginpakketten
moeten namen met een scope, zoals `@example-org/example-plugin`, worden gepubliceerd als de
overeenkomstige eigenaar `example-org`.

Als je van mening bent dat jouw organisatie, project of merk de rechtmatige eigenaar van de naamruimte is, maar
je de huidige ClawHub-eigenaar niet kunt beheren, open dan een
[issue voor het claimen van een organisatie/naamruimte](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
met openbaar, niet-gevoelig bewijs. Zie
[Organisatie- en naamruimteclaims](/clawhub/namespace-claims) voor richtlijnen voor bewijs en wat
je niet in openbare issues moet opnemen.

## `sync` meldt dat er geen skills zijn gevonden

`sync` zoekt naar mappen die `SKILL.md` of `skill.md` bevatten.

Wijs het naar de hoofdmappen die je wilt scannen:

```bash
clawhub sync --root /path/to/skills
```

Bekijk eerst een voorbeeld als je niet zeker weet wat er wordt gepubliceerd:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` weigert vanwege lokale wijzigingen

De lokale bestanden komen niet overeen met een versie die ClawHub kent. Kies een van de volgende opties:

- Behoud lokale wijzigingen en sla de update over.
- Overschrijf met de gepubliceerde versie:

```bash
clawhub update @openclaw/demo --force
```

- Publiceer je bewerkte kopie als een nieuwe slug of fork.

## De installatie van een plugin mislukt in OpenClaw

- Gebruik een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

- Controleer de detailpagina van het pakket op de scanstatus en compatibiliteitsmetagegevens.
- Controleer of je OpenClaw-versie voldoet aan het geadverteerde
  compatibiliteitsbereik van het pakket.
- Als het pakket verborgen, tegengehouden of geblokkeerd is, kan het mogelijk pas worden geïnstalleerd nadat
  de eigenaar het probleem heeft opgelost.

## Openbare API-aanvragen mislukken

- Respecteer de retryheaders van `429` en cache openbare lijst- en zoekresultaten.
- Verwijs gebruikers terug naar de canonieke ClawHub-vermelding.
- Spiegel geen verborgen, privé-, tegengehouden of door moderatie geblokkeerde inhoud buiten het
  openbare API-oppervlak.

Zie [HTTP-API](/clawhub/http-api) voor details over eindpunten.
