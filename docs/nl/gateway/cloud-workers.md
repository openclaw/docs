---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Sessies naar tijdelijke cloudmachines sturen: provisioning, worker-runtime, geproxyde inferentie en streamingresultaten'
title: Cloudworkers
x-i18n:
    generated_at: "2026-07-16T15:47:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Cloudworkers laten een sessie de agentlus uitvoeren op een tijdelijke cloudmachine, terwijl alles van de sessie op de gebruikelijke plek blijft: zichtbaar in de zijbalk, live streamend, met het transcript in beheer van de Gateway. De Gateway leaset een box, installeert daarop een vastgezette kopie van OpenClaw, synchroniseert de workspace van de sessie en draagt de beurtlus over aan een beperkt `openclaw worker`-proces. Modelaanroepen worden via de Gateway geproxied, zodat providerreferenties je machine nooit verlaten, en promptcaching blijft werken doordat de provider één doorlopende stream ziet.

Wanneer het werk klaar is (of de box uitvalt), wordt de machine verwijderd. De duurzame status — transcript, workspace-commits, plaatsingsrecords — blijft bij de Gateway.

<Note>
Cloudworkers zijn opt-in en onzichtbaar totdat je een profiel configureert. Niet-geconfigureerde installaties zien geen nieuwe RPC's, configuratie of UI.
</Note>

## Wat waar wordt uitgevoerd

| Onderdeel                                               | Locatie                                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Agentlus + tools (`exec`, `read`, `write`, `edit`, …) | Cloudworkerbox                                                                   |
| Modelinferentie en providerreferenties                  | Gateway (geproxied via `{provider, model}`-referentie)                            |
| Transcript (duurzaam, sessieopslag)                     | Gateway                                                                          |
| Live streamen naar de zijbalk                           | Gateway-fan-out, gevoed door de herhaalbare gebeurtenisstream van de worker      |
| Git-geschiedenis van de workspace                       | Zonder referenties aangemaakt op de box; de Gateway neemt commits over en beheert push/PR |

De box heeft behalve `sshd` geen inkomende poorten nodig: de Gateway maakt via vastgezette SSH een uitgaande verbinding en een omgekeerde tunnel voert de WebSocket van de worker terug. De meegeleverde Crabbox-provider dwingt de openbare SSH-route af en schakelt beheerde Tailscale-inschrijving uit. Uitgaande internettoegang wordt bepaald door het providerbeleid; het standaard AWS-profiel heeft toegang tot internet, tenzij je het netwerk of de beveiligingsgroep beperkt.

## Vereisten

- Een workerprovider-Plugin. De meegeleverde `crabbox`-Plugin stuurt de [Crabbox](https://github.com/openclaw/crabbox)-CLI aan, die leases via cloudbackends (AWS, Hetzner en andere) bemiddelt. Het binaire bestand `crabbox` moet op `PATH` staan (of stel `settings.binary` in), waarbij de providerreferenties al zijn geconfigureerd. Voor toelating tot AWS is Crabbox 0.38.1 of nieuwer vereist.
- Voor Crabbox AWS-workers moet de effectieve `aws.instanceProfile` leeg zijn. De provider controleert `crabbox config show --json` vóór toewijzing en vereist vervolgens dat `crabbox inspect --json` `providerMetadata.instanceProfileAttached: false` rapporteert vanuit EC2 `DescribeInstances`. Leases met een instancerol of zonder gezaghebbende metadata worden gestopt en geweigerd.
- Node.js op de geleasete machine. Kale cloudimages bevatten dit meestal niet — installeer het met de `setup`-opdracht van het profiel.
- Een sessie met een door de sessie beheerde worktree (maak er een met `worktree: true`). Bij dispatch worden de inhoud van die worktree verplaatst; gewone mappen worden als een manifestspiegel gesynchroniseerd.

## Configuratie

Voeg in `openclaw.json` een profiel toe onder `cloudWorkers.profiles`:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Profielvelden:

| Sleutel    | Betekenis                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | ID van de workerprovider die door een Plugin is geregistreerd (`crabbox` voor de meegeleverde Plugin).                                                                                                                                 |
| `install`  | `bundle` (standaard) levert de build van de actieve Gateway; `npm` installeert exact de uitgebrachte Gateway-versie met vastgezette integriteit. `npm` vereist dat de Gateway vanuit een verpakte release wordt uitgevoerd. |
| `settings` | JSON in beheer van de provider. Voor crabbox: `provider` (backend), `class` (machineklasse), `ttl`, `idleTimeout` (Go-duren), optioneel `setup` en een absoluut `binary`-pad. OpenClaw dwingt openbare SSH af en schakelt beheerde Tailscale uit voor deze leases. |
| `lifetime` | Optioneel opgeslagen beleid (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                           |

### De setupopdracht

`settings.setup` wordt op de geleasete box uitgevoerd nadat deze via SSH bereikbaar is en voordat OpenClaw wordt geïnstalleerd. De opdracht wordt bij **elke** provisioningpoging uitgevoerd (inclusief herhalingen na een onderbroken dispatch) en moet daarom idempotent zijn — beveilig installaties met een `command -v`- of `test -x`-controle zoals in het voorbeeld. Als de setup mislukt, stopt de provider de lease en mislukt de dispatch veilig; er blijft geen half-geconfigureerde box actief.

### Installatiekanalen

- **`bundle`** verpakt de `dist` van de actieve Gateway, een opgeschoonde `package.json` en alle workspacepakketten waarnaar de build verwijst, allemaal gedekt door een inhoudshash. De box verifieert de ongewijzigde bundel aan de hand van die hash en installeert vervolgens de npm-productieafhankelijkheden (scripts uitgeschakeld). Zo voer je een ontwikkelbuild uit op een worker.
- **`npm`** bewijst dat de release in het openbare register bestaat, zet de SHA-512-integriteit ervan vast en installeert `openclaw@<version>` dat exact overeenkomt met de Gateway.

## Een sessie dispatchen

Open in de Control UI **Nieuwe sessie**, kies een agent waarvan de geconfigureerde runtime OpenClaw is, selecteer in het menu **Waar** een geconfigureerd doel **Cloud · profiel** en start de taak. Bij cloudselectie wordt de vereiste beheerde worktree automatisch ingeschakeld; de Gateway maakt de sessie aan, voltooit de dispatch en verzendt pas daarna de eerste beurt. De serverbadge in de sessiezijbalk toont de duurzame plaatsingsstatus. Clouddoelen worden niet aangeboden voor externe CLI-sessiecatalogi.

De equivalente RPC-stroom is:

Maak een sessie met een beheerde worktree en dispatch deze vervolgens (de RPC vereist `operator.admin` en bestaat alleen wanneer profielen zijn geconfigureerd):

Cloudworkers voeren de OpenClaw-agentruntime uit. Kies een `openai/*` of een ander model dat naar die runtime wordt herleid; sessies die zijn geconfigureerd voor een externe CLI-runtime zoals `claude-cli` kunnen niet worden gedispatcht.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` sluit lokale toelating van beurten, laat actief werk leeglopen, provisiont de lease, voert de setup uit, bootstrapt OpenClaw, synchroniseert de workspace en keert terug zodra de plaatsing `active`-workereigenaarschap bereikt. Reken voor de eerste dispatch op enkele minuten; leases en installaties worden gecachet waar de provider dit ondersteunt. Daarna kun je de sessie zoals gewoonlijk gebruiken — beurten worden automatisch naar de worker gerouteerd.

Na voltooide workerbeurten worden geschikte workspacebestanden binnen de maximale grootte teruggesynchroniseerd naar de beheerde worktree van de sessie voordat de beurtclaim wordt vrijgegeven. De afsluitende workergebeurtenis maakt vóór bevestiging een duurzame afbakening voor het wachtende resultaat, zodat bij herstel na een herstart van de Gateway de externe workspace wordt teruggehaald voordat het opruimen van verouderde beurten de eigenaar ervan kan vernietigen. Bij reconciliatie wordt het workermanifest geauthenticeerd en wordt bij lokale divergentie gestopt in plaats van een van beide kanten te overschrijven. Voordat bestanden worden gewijzigd, slaat de Gateway een begrensd terugroljournaal op in zijn SQLite-statusdatabase; na een onderbroken Gateway-proces herstelt een nieuwe poging dat journaal. Workspaceresultaten gebruiken de bestandssemantiek van Git: gewone bestanden, uitvoerbare bits, symbolische koppelingen, toevoegingen, wijzigingen en verwijderingen blijven behouden, maar lege mappen en andere mapmodi niet. Externe commitobjecten blijven niet behouden; de resulterende bestandswijzigingen blijven in de beheerde worktree staan voor normale beoordeling en commit.

Wanneer het werk voltooid is en er geen beurt wordt uitgevoerd, open je het sessiemenu en kies je **Cloudworker stoppen…**. De Gateway voert een laatste workspacereconciliatie uit voordat de omgeving wordt vernietigd. Een plaatsing die al de status `draining` of `reconciling` heeft, voltooit de afbouw; wacht tot de badge `reclaimed` wordt voordat je de sessie verwijdert.

Voor een defecte of ontspoorde gekoppelde worker kan een operator als laatste redmiddel `environments.destroy` aanroepen met `{ "force": true }`. Geforceerde afbouw markeert de plaatsing duurzaam als mislukt en laat elk niet-gereconcilieerd extern resultaat achter voordat de omgeving wordt vernietigd.

De equivalente administratieve RPC is:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

De plaatsing doorloopt een duurzame toestandsmachine (`local → requested → provisioning → syncing → starting → active`), zodat een herstart van de Gateway tijdens een dispatch tot reconciliatie leidt in plaats van machines te laten lekken. Na een mislukte modelbeurt blijft de actieve plaatsing beschikbaar voor een nieuwe poging. Als inkomende workspacereconciliatie mislukt, blijft de worker eveneens actief, zodat de operator het lokale conflict kan oplossen en opnieuw kan proberen zonder het externe resultaat te verliezen; levenscyclusfouten verplaatsen de plaatsing daarentegen naar een fout- of teruggevorderde status en behouden hun diagnostische staart.

## Beveiligingsmodel

- **Gesloten worker-ingang.** Workers communiceren via een speciaal protocol op de getunnelde socket met een gesloten toestemmingslijst voor methoden — een worker kan geen operator-RPC's aanroepen.
- **Aangemaakte referenties, gehasht opgeslagen.** Elke dispatch maakt een workerreferentie aan; de Gateway slaat alleen de hash ervan op. Rotatie van referenties en afscherming op basis van eigenaarsepoch garanderen maximaal één actieve eigenaar per sessie — een verouderde worker die opnieuw verbinding maakt, wordt afgeschermd en nooit samengevoegd.
- **Vastzetten van hostsleutels.** De provider moet tijdens provisioning de SSH-hostsleutel van de box beschikbaar stellen; bootstrap maakt verbinding met strikte vastzetting en mislukt veilig als die sleutel ontbreekt.
- **Geen permanente model-, forge- of cloudreferenties op de box.** Modelauthenticatie blijft op de Gateway (inferentie verloopt via de `{provider, model}`-referentie), Git-commits in de workspace worden zonder forge-referenties aangemaakt en de Crabbox AWS-leasemetadata worden vóór de setup gezaghebbend gecontroleerd op een instancerol. Houd ook setupopdrachten vrij van referenties.
- **Uitgaand verkeer in beheer van de provider.** Door de omgekeerde tunnel heeft OpenClaw geen directe modeltoegang nodig, maar OpenClaw herschrijft de firewalls van de provider niet. Beperk uitgaand verkeer bij de workerprovider wanneer de taak dit vereist.
- **Duurzame, exact-eenmaaltranscripten.** De worker commit transcriptbatches via een compare-and-swap-protocol tegen het blad van de sessie; een verouderde basis stopt de uitvoering veilig in plaats van betaalde uitvoer te dupliceren of te rebasen.

## Probleemoplossing

- **`sessions.dispatch` is een onbekende methode** — er zijn geen `cloudWorkers.profiles` geconfigureerd of de aanroeper beschikt niet over `operator.admin`.
- **"Cloudworkerbeurten vereisen de OpenClaw-runtime"** — kies een model waarvan de geconfigureerde runtime OpenClaw is. Externe CLI-runtimes zoals `claude-cli` ondersteunen geen worker-inferentie.
- **"Voor het initialiseren van een worker is Node.js vereist op de geleasete host"** — voeg een Node-installatie toe aan `settings.setup` (zie hierboven).
- **Attestatie van de AWS-instancerol mislukt** — wis `aws.instanceProfile` (en `CRABBOX_AWS_INSTANCE_PROFILE`, indien ingesteld). Installeer Crabbox 0.38.1 of nieuwer; oudere binaire bestanden bieden niet het gezaghebbende `providerMetadata.instanceProfileAttached`-contract dat vereist is voor AWS-toelating.
- **Dispatch mislukt met een providerfout** — de plaatsingsrecord en `environments.list` bewaren de laatste fout, inclusief het laatste deel van stderr van de installatie/initialisatie. Boxes worden bij een fout vernietigd, dus dat laatste deel is de primaire bron voor forensisch onderzoek.
- **Clienttime-out tijdens dispatch** — `openclaw gateway call` gebruikt standaard een time-out van 10s; geef `--timeout` ruim op (dispatch blijft hoe dan ook aan de serverzijde actief en een nieuwe poging tijdens de inrichting wordt afgewezen met `session cannot dispatch from placement provisioning`).
- **Leasebeheer** — `crabbox list --provider <backend>` toont actieve leases; `crabbox stop --provider <backend> --id <lease>` geeft er handmatig één vrij. Inactieve leases verlopen volgens de `idleTimeout` van het profiel.

## Gerelateerd

- [Sandboxing](/nl/gateway/sandboxing) — de impact van lokale tooluitvoering beperken
- [CLI voor sessies](/nl/cli/sessions) — opgeslagen sessies inspecteren
- [Configuratiereferentie](/nl/gateway/configuration-reference)
