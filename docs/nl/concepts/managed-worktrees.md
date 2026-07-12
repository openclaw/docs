---
read_when:
    - Je wilt een geïsoleerde branch en checkout voor een agenttaak
    - U configureert Workboard-kaarten met worktree-werkruimten
    - U moet een door OpenClaw beheerde worktree herstellen of opschonen
summary: Voer agenttaken uit in geïsoleerde git-checkouts met automatische momentopnamen en opschoning
title: Beheerde worktrees
x-i18n:
    generated_at: "2026-07-12T08:49:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Beheerde worktrees geven een agenttaak een eigen git-branch en checkout zonder tijdelijke mappen in de bronrepository te plaatsen. OpenClaw maakt ze aan onder de statusmap, registreert ze in de gedeelde statusdatabase en maakt vóór verwijdering een momentopname van de gevolgde en niet-genegeerde niet-gevolgde inhoud.

## Indeling en namen

Elke worktree bevindt zich op:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

De repositoryvingerafdruk bestaat uit de eerste 16 hexadecimale tekens van een SHA-256-hash van de canonieke gemeenschappelijke git-map en de origin-URL. Een opgegeven naam moet overeenkomen met `[a-z0-9][a-z0-9-]{0,63}`. Zonder naam genereert OpenClaw `wt-`, gevolgd door acht willekeurige hexadecimale tekens.

OpenClaw maakt de branch `openclaw/<name>` aan op de gevraagde basisreferentie. Zonder basisreferentie haalt het `origin` op, gebruikt het waar beschikbaar de standaardbranch van de remote en valt het terug op de lokale `HEAD` wanneer de repository offline is of geen bruikbare remote heeft.

## Genegeerde bestanden beschikbaar stellen

Voeg `.worktreeinclude` toe aan de hoofdmap van de bronrepository om geselecteerde genegeerde, niet-gevolgde bestanden naar een nieuwe worktree te kopiëren. Het bestand gebruikt gitignore-patroonsyntaxis, met één patroon per regel en opmerkingen met `#`:

```gitignore
.env.local
fixtures/generated/**
```

Alleen bestanden die git als zowel genegeerd als niet-gevolgd rapporteert, komen in aanmerking. Gevolgde bestanden zijn al via git aanwezig en worden tijdens deze stap nooit gekopieerd. OpenClaw overschrijft geen doelbestanden, volgt geen mappen die symbolische koppelingen zijn en behoudt de bestandsmodi van gekopieerde bestanden.

## Repository-installatie uitvoeren

Als `.openclaw/worktree-setup.sh` in de bronrepository bestaat en uitvoerbaar is, voert OpenClaw het uit met de nieuwe worktree als huidige map. Het script ontvangt:

```text
OPENCLAW_SOURCE_TREE_PATH=<broncheckout>
OPENCLAW_WORKTREE_PATH=<beheerde-worktree>
```

Een afsluitcode anders dan nul breekt het aanmaken af en verwijdert de nieuwe worktree en branch. Dit is een repositorylokaal contract; hiervoor bestaat geen OpenClaw-configuratiesleutel.

## Sessieworktrees

Start een geïsoleerde chat vanuit de git-werkruimte van de actieve agent met een door een worktree ondersteunde sessie: schakel **Worktree** in op de pagina New session van de Control UI (die ook een keuzelijst voor een basisbranch en een optionele worktreenaam biedt), of gebruik het menu Chat actions op iOS of de overloopactie naast New Chat op Android. De optie is alleen beschikbaar voor een door git ondersteunde agent wanneer de client die mogelijkheid heeft; clients die dit niet vooraf kunnen controleren, tonen in plaats daarvan de Gateway-fout.

Codeeragents kunnen ook `spawn_task` aanroepen wanneer ze bevestigd vervolgwerk buiten de huidige taak ontdekken. De Control UI toont een suggestiechip zonder iets te starten, terwijl een door een Gateway ondersteunde TUI een interactieve prompt met dezelfde acties toont. Als u **Start in worktree** selecteert, wordt vanuit het voorgestelde project een nieuwe worktree aangemaakt die eigendom is van de sessie en wordt de zelfstandige prompt als eerste beurt verzonden; als u de suggestie sluit, blijft de repository ongewijzigd. Suggesties en hun ID's zijn tijdelijk en blijven niet behouden na een herstart van de Gateway.

OpenClaw stelt deze hulpmiddelen alleen beschikbaar aan operatorsessies met een bruikbare Gateway-UI. Kanaalsessies en lokale/ingesloten TUI-sessies ontvangen ze pas wanneer die oppervlakken een overdraagbaar, getypeerd contract voor taakacties hebben.

De resulterende beheerde worktree is eigendom van de sessie en elke agentuitvoering in die sessie gebruikt de checkout ervan. Wanneer de werkruimte een submap van een repository is, wordt de worktree verankerd in de hoofdmap van de repository en wordt de sessie uitgevoerd vanuit de overeenkomstige submap daarin. Voor het aanmaken van een sessieworktree wordt het bereik `operator.write` van de methode gebruikt, maar de stap `.openclaw/worktree-setup.sh` wordt alleen uitgevoerd voor aanroepers met `operator.admin`, omdat hiermee repositorycode wordt uitgevoerd; het beschikbaar stellen via `.worktreeinclude` geldt nog steeds voor elke aanroeper. Bij het verwijderen van de sessie wordt de worktree alleen verwijderd als dit zonder verlies kan. Gewijzigde worktrees of branches met niet-gepushte commits blijven beschikbaar; de uurlijkse opschoning maakt na 7 dagen inactiviteit momentopnamen van sessieworktrees, waarbij recente sessieactiviteit als worktreeactiviteit geldt. Verwijderde worktrees kunnen vanuit hun momentopnamen worden hersteld zoals hieronder beschreven.

`sessions.create` kan samen met `worktree: true` een absolute `cwd` bevatten wanneer een taak is gericht op een ander project dan de geconfigureerde agentwerkruimte. Dat expliciete hostpad vereist `operator.admin`; het normale aanmaken van een worktreechat blijft onder `operator.write` vallen en blijft verankerd in de geconfigureerde werkruimte.

`sessions.create` accepteert naast `worktree: true` ook `worktreeBaseRef` en `worktreeName` om de basisreferentie en worktreenaam te kiezen (de branch wordt `openclaw/<name>`); beide blijven onder `operator.write` vallen. De aangemaakte worktree wordt teruggegeven in het aanmaakresultaat en in de sessierij opgeslagen als `worktree: { id, branch, repoRoot }`, zodat sessielijsten de checkout en branch kunnen tonen. Bij het verwijderen van een sessie wordt een behouden gewijzigde checkout gemeld als `worktreePreserved` in plaats van deze stilzwijgend achter te laten.

## Momentopnamen, opschoning en herstel

Bij verwijdering wordt eerst een synthetische commit aangemaakt met gevolgde en niet-genegeerde niet-gevolgde bestanden, die wordt vastgezet op `refs/openclaw/snapshots/<id>`. Door git genegeerde bestanden worden uitgesloten van de objectdatabase van de repository; bestanden die door `.worktreeinclude` zijn geselecteerd, worden tijdens het herstel opnieuw gekopieerd. Als het maken van de momentopname mislukt, stopt de verwijdering. Een expliciete geforceerde verwijdering kan zonder momentopname doorgaan.

OpenClaw past deze opschoningsregels toe:

- Aan het einde van een uitvoering verwijdert het een worktree alleen wanneer `git status --porcelain` leeg is en `git log HEAD --not --remotes --oneline` geen niet-gepushte commits vindt. Anders geeft het alleen de activiteitsvergrendeling vrij.
- De uurlijkse opschoning maakt momentopnamen van ontgrendelde worktrees die eigendom zijn van Workboard of een sessie en langer dan 7 dagen inactief zijn, en verwijdert ze, zelfs wanneer ze gewijzigd zijn. Handmatige worktrees worden nooit automatisch verwijderd.
- Momentopnamerecords blijven 30 dagen herstelbaar. Daarna verwijdert de opschoning de momentopnamereferentie en de registerrij.
- Een actieve OpenClaw-procesvergrendeling en elke externe of niet-herkende git-worktreevergrendeling beschermen een worktree tegen garbagecollection.

Bij herstel wordt `openclaw/<name>` opnieuw aangemaakt op de oorspronkelijke commit van vóór de momentopname, waarna de verschillen uit de momentopname worden hersteld als niet-gestagede wijzigingen en niet-gevolgde bestanden. Hierdoor blijft de synthetische momentopnamecommit buiten de branchgeschiedenis. De momentopnamereferentie blijft als herkomst geregistreerd.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

De pagina **Worktrees** onder Settings in de Control UI biedt dezelfde acties, plus aanmaken met een keuzelijst voor een basisbranch, toont de eigenaar van elke worktree (handmatig, Workboard of de eigenaarsessie met een koppeling naar de bijbehorende chat) en biedt een geforceerde nieuwe poging wanneer bij een verwijdering wordt gemeld dat het maken van de momentopname is mislukt.

## Gateway-methoden

| Methode              | Doel                                                                           |
| -------------------- | ------------------------------------------------------------------------------ |
| `worktrees.list`     | Actieve en herstelbare worktreerecords weergeven.                              |
| `worktrees.branches` | Lokale en remote-branches van een repository weergeven voor basisreferentiekeuzelijsten. |
| `worktrees.create`   | Een benoemde beheerde worktree aanmaken of hergebruiken.                       |
| `worktrees.remove`   | Een momentopname maken en een worktree verwijderen. Geforceerde verwijderingen melden `snapshotError`. |
| `worktrees.restore`  | Een verwijderde worktree vanuit de momentopname herstellen.                    |
| `worktrees.gc`       | Opschoning van inactieve en verweesde items en bewaartermijnen nu uitvoeren.   |

`worktrees.list` vereist `operator.read` en de wijzigende methoden vereisen `operator.admin`. `worktrees.branches` vereist `operator.write` voor geconfigureerde agentwerkruimten, terwijl elk ander hostpad `operator.admin` vereist (overeenkomstig de `cwd`-drempel van `sessions.create`). De methode leest alleen bestaande referenties en haalt nooit gegevens op; branches die alleen op de remote bestaan, worden met remote-kwalificatie teruggegeven (`origin/feature-a`), zodat elke teruggegeven naam als basisreferentie kan worden omgezet.

## Workboard-werkruimten

De meegeleverde [Workboard-Plugin](/nl/plugins/workboard) kan een kaartwerkruimte als beheerde worktree materialiseren:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identificeert de git-broncheckout. `branch` is optioneel en wordt de basisreferentie. Wanneer de dispatch de worker van de kaart start, maakt Workboard `wb-<card-id>` aan of gebruikt het deze opnieuw, voert het de subagent uit met de beheerde checkout als werkmap en schrijft het opgeloste pad en de opgeloste branch terug naar de kaart. Door de Gateway geactiveerde materialisatie vereist `operator.admin`. Aan het einde van de uitvoering verwijdert Workboard de checkout alleen wanneer aantoonbaar is dat dit zonder verlies kan; gewijzigd werk of niet-gepushte commits blijft beschikbaar.

In een sandbox uitgevoerde ingesloten agents weigeren momenteel een taakwerkmap buiten hun geconfigureerde agentwerkruimte. Gebruik voor door Workboard beheerde worktree-kaarten een doelagent zonder sandbox totdat de sandboxruntime een aanvullende checkoutkoppeling ondersteunt.
