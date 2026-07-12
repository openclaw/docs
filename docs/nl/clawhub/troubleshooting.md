---
read_when:
    - ClawHub CLI- of OpenClaw-registeropdrachten mislukken
    - Een pakket kan niet worden geïnstalleerd, gepubliceerd of bijgewerkt
summary: Problemen oplossen met aanmelden bij ClawHub, installeren, publiceren, bijwerken en de API.
x-i18n:
    generated_at: "2026-07-12T08:39:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Problemen oplossen

## `clawhub login` opent een browser, maar wordt nooit voltooid

De CLI start tijdens het aanmelden via de browser een lokale callbackserver met een korte levensduur.

- Zorg ervoor dat uw browser `http://127.0.0.1:<port>/callback` kan bereiken.
- Controleer de lokale firewall-, VPN- en proxyregels als de callback nooit aankomt.
- Maak in headless omgevingen een API-token aan in de ClawHub-webinterface en voer het volgende uit:

```bash
clawhub login --token clh_...
```

## `whoami` of `publish` retourneert `Unauthorized` (401)

- Meld u opnieuw aan met `clawhub login`.
- Als u een aangepast configuratiepad gebruikt, controleer dan of `CLAWHUB_CONFIG_PATH` verwijst naar het bestand dat uw huidige token bevat.
- Als u een API-token gebruikt, controleer dan in de webinterface of dit niet is ingetrokken.

## Zoeken of installeren retourneert `Rate limit exceeded` (429)

Lees de informatie over opnieuw proberen in het antwoord:

- `Retry-After`: het aantal seconden dat u moet wachten voordat u het opnieuw probeert.
- `RateLimit-Limit`: de limiet die op deze aanvraag is toegepast.
- `RateLimit-Remaining`: uw exacte resterende quotum wanneer de header aanwezig is. Bij `429` is dit `0`.
- `RateLimit-Reset` of `X-RateLimit-Reset`: het tijdstip waarop de limiet opnieuw wordt ingesteld.

Als veel gebruikers één uitgaand IP-adres delen, kunnen anonieme IP-limieten worden bereikt, zelfs wanneer elke persoon slechts enkele aanvragen verstuurt. Meld u waar mogelijk aan en probeer het opnieuw na de gemelde wachttijd.

## Zoeken of installeren mislukt achter een proxy

De CLI respecteert standaardproxyvariabelen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Ondersteunde namen zijn onder meer `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` en `http_proxy`.

## Een skill wordt niet weergegeven in de zoekresultaten

- Controleer de exacte slug of eigenaarspagina als u die kent.
- Controleer of de release openbaar is en niet wordt vastgehouden vanwege een scan of moderatie.
- Als u eigenaar bent van de skill, meld u dan aan en inspecteer deze:

```bash
clawhub inspect @openclaw/demo
```

Diagnostische gegevens die zichtbaar zijn voor de eigenaar kunnen de scan-, uploadbeperkings- of moderatiestatus verklaren.

## Publiceren mislukt omdat vereiste metadata ontbreekt

Controleer voor Skills de frontmatter van `SKILL.md`. Vereiste omgevingsvariabelen en hulpmiddelen moeten worden gedeclareerd, zodat gebruikers en scanners het pakket kunnen begrijpen.

Controleer voor plugins de compatibiliteitsmetadata in `package.json`. Voor het publiceren van codeplugins zijn OpenClaw-compatibiliteitsvelden vereist, zoals `openclaw.compat.pluginApi` en `openclaw.build.openclawVersion`.

Bekijk eerst een voorbeeld van de publicatiepayload:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publiceren mislukt vanwege een GitHub-eigenaars- of bronfout

ClawHub gebruikt de GitHub-identiteit en brontoeschrijving om pakketten aan hun uitgevers te koppelen.

- Zorg ervoor dat u bent aangemeld met het GitHub-account dat eigenaar is van het pakket of het kan publiceren.
- Controleer of de bron-URL openbaar of toegankelijk is voor ClawHub.
- Gebruik voor GitHub-bronnen `owner/repo`, `owner/repo@ref` of een volledige GitHub-URL.

## Publiceren mislukt omdat een naamruimte geclaimd of gereserveerd is

Als publiceren mislukt omdat de eigenaarsnaam, organisatienaamruimte, pakketbereik, skill-slug of pakketnaam al geclaimd of gereserveerd is, controleer dan eerst of u publiceert met de eigenaar die overeenkomt met de naamruimte. Voor pluginpakketten moeten namen met een bereik, zoals `@example-org/example-plugin`, worden gepubliceerd met de overeenkomende eigenaar `example-org`.

Als u van mening bent dat uw organisatie, project of merk de rechtmatige eigenaar van de naamruimte is, maar u de huidige ClawHub-eigenaar niet kunt beheren, open dan een [probleem voor een organisatie-/naamruimteclaim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) met openbaar, niet-gevoelig bewijs. Zie [Organisatie- en naamruimteclaims](/clawhub/namespace-claims) voor richtlijnen voor het bewijs en wat u niet in openbare problemen moet opnemen.

## `sync` meldt dat er geen Skills zijn gevonden

`sync` zoekt naar mappen die `SKILL.md` of `skill.md` bevatten.

Laat de opdracht verwijzen naar de hoofdmappen die u wilt scannen:

```bash
clawhub sync --root /path/to/skills
```

Bekijk eerst een voorbeeld als u niet zeker weet wat er wordt gepubliceerd:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` weigert vanwege lokale wijzigingen

De lokale bestanden komen niet overeen met een versie die ClawHub kent. Kies een van de volgende opties:

- Behoud de lokale bewerkingen en sla de update over.
- Overschrijf ze met de gepubliceerde versie:

```bash
clawhub update @openclaw/demo --force
```

- Publiceer uw bewerkte kopie onder een nieuwe slug of als fork.

## De installatie van een plugin mislukt in OpenClaw

- Gebruik een expliciete ClawHub-bron:

```bash
openclaw plugins install clawhub:<package>
```

- Controleer op de detailpagina van het pakket de scanstatus en compatibiliteitsmetadata.
- Controleer of uw OpenClaw-versie binnen het opgegeven compatibiliteitsbereik van het pakket valt.
- Als het pakket verborgen, vastgehouden of geblokkeerd is, kan het mogelijk pas worden geïnstalleerd nadat de eigenaar het probleem heeft opgelost.

## Openbare API-aanvragen mislukken

- Respecteer de headers voor opnieuw proberen bij `429` en cache openbare lijst- en zoekresultaten.
- Verwijs gebruikers terug naar de canonieke ClawHub-vermelding.
- Spiegel geen verborgen, privé-, vastgehouden of door moderatie geblokkeerde inhoud buiten het openbare API-oppervlak.

Zie [HTTP-API](/clawhub/http-api) voor details over eindpunten.
