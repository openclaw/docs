---
read_when:
    - Nieuwe installatie, vastgelopen onboarding of fouten bij de eerste uitvoering
    - Authenticatie- en providerabonnementen kiezen
    - Geen toegang tot docs.openclaw.ai, kan het dashboard niet openen, installatie loopt vast
sidebarTitle: First-run FAQ
summary: 'Veelgestelde vragen: snelstart en configuratie voor de eerste keer — installatie, onboarding, authenticatie, abonnementen, eerste fouten'
title: 'FAQ: configuratie bij de eerste uitvoering'
x-i18n:
    generated_at: "2026-07-16T15:54:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 787d003d18e01ddc28cee74224f9a82cf80f48b8de7c56ba9f9f7a3d187a026a
    source_path: help/faq-first-run.md
    workflow: 16
---

Snelstart en vragen en antwoorden voor de eerste keer. Zie voor dagelijkse bewerkingen, modellen, authenticatie, sessies
en probleemoplossing de hoofd-[FAQ](/nl/help/faq).

## Snelstart en eerste configuratie

<AccordionGroup>
  <Accordion title="Ik zit vast; wat is de snelste manier om verder te komen?">
    Gebruik een lokale AI-agent die **je machine kan zien**. De meeste gevallen waarin iemand
    vastzit, zijn **problemen met de lokale configuratie of omgeving** die een externe helper
    niet kan onderzoeken. Dit werkt daarom beter dan hulp vragen in Discord.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Geef de agent via de aanpasbare (git-)installatie toegang tot de volledige broncode-checkout,
    zodat deze de code en documentatie kan lezen en kan redeneren over de exacte versie die je uitvoert:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Vraag de agent om de oplossing stap voor stap te plannen en te begeleiden en vervolgens alleen
    de noodzakelijke opdrachten uit te voeren. Kleinere diffs zijn eenvoudiger te controleren.

    Deel deze uitvoer wanneer je om hulp vraagt (in Discord of een GitHub-issue):

    | Opdracht | Toont |
    | --- | --- |
    | `openclaw status` | Status van Gateway/agent + momentopname van de basisconfiguratie |
    | `openclaw status --all` | Volledige alleen-lezen diagnose die je kunt plakken |
    | `openclaw models status` | Providerauthenticatie + beschikbaarheid van modellen |
    | `openclaw doctor` | Valideert en repareert veelvoorkomende configuratie-/statusproblemen |
    | `openclaw logs --follow` | Live loguitvoer |
    | `openclaw gateway status --deep` | Grondige statuscontrole van Gateway/configuratie/Plugin |
    | `openclaw health --verbose` | Gedetailleerd statusrapport |

    Een echte bug of oplossing gevonden? Dien een issue in of stuur een PR:
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull requests](https://github.com/openclaw/openclaw/pulls).

    Snelle foutopsporingscyclus: [De eerste 60 seconden als er iets kapot is](/nl/help/faq#first-60-seconds-if-something-is-broken).
    Installatiedocumentatie: [Installatie](/nl/install), [Installatievlaggen](/nl/install/installer), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wordt steeds overgeslagen. Wat betekenen de redenen daarvoor?">
    | Reden voor overslaan | Betekenis |
    | --- | --- |
    | `quiet-hours` | Buiten het geconfigureerde tijdvenster met actieve uren |
    | `empty-heartbeat-file` | `HEARTBEAT.md` bestaat, maar bevat alleen lege regels, opmerkingen, koppen, fences of een lege checkliststructuur |
    | `no-tasks-due` | De taakmodus is actief, maar er is nog geen taakinterval verstreken |
    | `alerts-disabled` | Alle zichtbaarheid voor Heartbeat is uitgeschakeld (`showOk`, `showAlerts` en `useIndicator` zijn allemaal uitgeschakeld) |

    In de taakmodus worden geplande tijdstempels pas bijgewerkt nadat een echte Heartbeat-uitvoering is voltooid.
    Overgeslagen uitvoeringen markeren taken niet als voltooid.

    Documentatie: [Heartbeat](/nl/gateway/heartbeat), [Automatisering](/nl/automation).

  </Accordion>

  <Accordion title="Aanbevolen manier om OpenClaw te installeren en configureren">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Vanuit de broncode (bijdragers/ontwikkelaars):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Nog geen globale installatie? Voer dan `pnpm openclaw onboard` uit. Als de Control UI-assets
    ontbreken, probeert de onboarding ze zelf te bouwen, met `pnpm ui:build` als terugvaloptie.

  </Accordion>

  <Accordion title="Hoe open ik het dashboard na de onboarding?">
    De onboarding opent direct na de configuratie je browser met een schone dashboard-URL
    (zonder token) en drukt de link af in de samenvatting. Houd dat tabblad open. Als het niet
    is geopend, kopieer en plak je de afgedrukte URL op dezelfde machine.
  </Accordion>

  <Accordion title="Hoe authenticeer ik het dashboard op localhost en op afstand?">
    **Localhost (dezelfde machine):**

    - Open `http://127.0.0.1:18789/`.
    - Als om authenticatie met een gedeeld geheim wordt gevraagd, plak je het geconfigureerde token of wachtwoord in de Control UI-instellingen.
    - Bron van het token: `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
    - Bron van het wachtwoord: `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
    - Nog geen gedeeld geheim geconfigureerd? Voer `openclaw doctor --generate-gateway-token` (of `openclaw doctor --fix --generate-gateway-token`) uit.

    **Niet op localhost:**

    - **Tailscale Serve** (aanbevolen): behoud de loopback-binding, voer `openclaw gateway --tailscale serve` uit en open `https://<magicdns>/`. Met `gateway.auth.allowTailscale: true` voldoen identiteitsheaders aan de authenticatievereisten van Control UI/WebSocket (geen geplakt gedeeld geheim nodig; er wordt uitgegaan van een vertrouwde Gateway-host). HTTP-API's vereisen nog steeds authenticatie met een gedeeld geheim, tenzij je bewust `none` voor privé-ingang of HTTP-authenticatie via een vertrouwde proxy gebruikt.
      Gelijktijdige Serve-pogingen met onjuiste authenticatie vanaf dezelfde client worden geserialiseerd voordat de mislukte-authenticatiebegrenzer ze registreert. Daardoor kan een tweede onjuiste poging al `retry later` tonen.
    - **Tailnet-binding**: voer `openclaw gateway --bind tailnet --token "<token>"` uit (of configureer wachtwoordauthenticatie), open `http://<tailscale-ip>:18789/` en plak het bijbehorende gedeelde geheim in de dashboardinstellingen.
    - **Identiteitsbewuste reverse proxy**: houd de Gateway achter een vertrouwde proxy, stel `gateway.auth.mode: "trusted-proxy"` in en open de proxy-URL. Loopback-proxy's op dezelfde host vereisen expliciet `gateway.auth.trustedProxy.allowLoopback: true`.
    - **SSH-tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`; open daarna `http://127.0.0.1:18789/`. Authenticatie met een gedeeld geheim is ook via de tunnel vereist. Plak het geconfigureerde token of wachtwoord als daarom wordt gevraagd.

    Zie [Dashboard](/nl/web/dashboard) en [Weboppervlakken](/nl/web) voor bindingsmodi en authenticatiedetails.

  </Accordion>

  <Accordion title="Waarom zijn er twee configuraties voor exec-goedkeuringen via chat?">
    Ze besturen verschillende lagen:

    - `approvals.exec` - stuurt goedkeuringsverzoeken door naar chatbestemmingen.
    - `channels.<channel>.execApprovals` - maakt dat kanaal een systeemeigen goedkeuringsclient voor exec-goedkeuringen.

    Het exec-beleid van de host blijft de daadwerkelijke goedkeuringspoort. De chatconfiguratie
    bepaalt alleen waar verzoeken verschijnen en hoe mensen erop antwoorden.

    Je hebt ze zelden allebei nodig:

    - Als de chat al opdrachten en antwoorden ondersteunt, werkt `/approve` in dezelfde chat via het gedeelde pad.
    - Wanneer een ondersteund systeemeigen kanaal de goedkeurders veilig kan afleiden, schakelt OpenClaw automatisch systeemeigen goedkeuringen met DM als eerste keuze in als `channels.<channel>.execApprovals.enabled` niet is ingesteld of `"auto"` is.
    - Wanneer systeemeigen goedkeuringskaarten/-knoppen beschikbaar zijn, is die interface leidend. Vermeld een handmatige opdracht `/approve` alleen als het toolresultaat aangeeft dat chatgoedkeuringen niet beschikbaar zijn.
    - Gebruik `approvals.exec` alleen wanneer verzoeken ook andere chats of expliciete operationele ruimtes moeten bereiken.
    - Gebruik `channels.<channel>.execApprovals.target: "channel"` of `"both"` alleen wanneer je wilt dat goedkeuringsverzoeken terug worden geplaatst in de oorspronkelijke ruimte/het oorspronkelijke onderwerp.
    - Plugin-goedkeuringen staan los hiervan: standaard `/approve` in dezelfde chat, optioneel doorsturen via `approvals.plugin`, en slechts sommige systeemeigen kanalen behouden ook daarvoor de systeemeigen afhandeling.

    Kort gezegd: doorsturen is bedoeld voor routering; de configuratie van een systeemeigen client is bedoeld voor een rijkere, kanaalspecifieke gebruikerservaring.
    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welke runtime heb ik nodig?">
    Node **22.22.3+**, **24.15+** of **25.9+** is vereist (Node 24 wordt aanbevolen). `pnpm` is de pakketbeheerder van de repository.
    Bun kan afhankelijkheden installeren en pakketscripts uitvoeren, maar kan de OpenClaw-CLI of Gateway niet uitvoeren omdat `node:sqlite` ontbreekt.
  </Accordion>

  <Accordion title="Werkt het op Raspberry Pi?">
    Ja, maar controleer eerst het RAM-geheugen: Pi 5 en Pi 4 (2 GB+) zijn ideaal; Pi 3B+ (1 GB) werkt, maar is traag; Pi Zero 2 W (512 MB) wordt niet aanbevolen.

    | Model | RAM | Geschiktheid |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Beste |
    | Pi 4 | 4 GB | Goed |
    | Pi 4 | 2 GB | Voldoende, voeg swap toe |
    | Pi 4 | 1 GB | Krap |
    | Pi 3B+ | 1 GB | Traag |
    | Pi Zero 2 W | 512 MB | Niet aanbevolen |

    Absoluut minimum: 1 GB RAM, 1 core, 500 MB vrije schijfruimte en een 64-bits besturingssysteem. Omdat de Pi alleen
    de Gateway uitvoert (modellen roepen cloud-API's aan), kan zelfs een bescheiden Pi de belasting aan.

    Een kleine Pi/VPS kan ook alleen de Gateway hosten, terwijl je **nodes** op je
    laptop/telefoon koppelt voor een lokaal scherm, lokale camera/canvas of het uitvoeren van opdrachten. Zie [Nodes](/nl/nodes).

    Volledige configuratiehandleiding: [Raspberry Pi](/nl/install/raspberry-pi).

  </Accordion>

  <Accordion title="Tips voor installaties op Raspberry Pi?">
    - Gebruik een **64-bits** besturingssysteem; gebruik geen 32-bits Raspberry Pi OS.
    - Voeg swap toe op borden met 2 GB of minder.
    - Geef voor prestaties en levensduur de voorkeur aan een **USB-SSD** boven een SD-kaart.
    - Geef de voorkeur aan de aanpasbare (git-)installatie, zodat je logboeken kunt bekijken en snel kunt bijwerken.
    - Begin zonder kanalen/Skills en voeg ze een voor een toe.
    - Vreemde binaire fouten ("exec format error") worden meestal veroorzaakt door een ontbrekende ARM64-build voor een optionele Skill-tool.

    Volledige handleiding: [Raspberry Pi](/nl/install/raspberry-pi). Zie ook [Linux](/nl/platforms/linux).

  </Accordion>

  <Accordion title="Het blijft hangen bij wake up my friend / de onboarding komt niet uit. Wat nu?">
    Dit scherm is afhankelijk van een bereikbare en geauthenticeerde Gateway. De TUI stuurt bij
    de eerste keer uitkomen ook automatisch "Wake up, my friend!" wanneer een modelprovider is
    geconfigureerd. Als je de model-/authenticatieconfiguratie hebt overgeslagen, toont de
    onboarding de melding "Model auth missing" en opent de TUI zonder iets te verzenden — voeg
    een provider toe met `openclaw configure --section model`.
    Als je de wekregel ziet zonder **antwoord** en het aantal tokens op 0 blijft, is de agent nooit uitgevoerd.

    1. Start de Gateway opnieuw:

    ```bash
    openclaw gateway restart
    ```

    2. Controleer status + authenticatie:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Blijft het hangen? Voer dit uit:

    ```bash
    openclaw doctor
    ```

    Als de Gateway extern is, controleer je of de tunnel-/Tailscale-verbinding actief is en
    de gebruikersinterface naar de juiste Gateway verwijst. Zie [Externe toegang](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Kan ik mijn configuratie naar een nieuwe machine migreren zonder de onboarding opnieuw uit te voeren?">
    Ja. Kopieer de **statusmap** en **werkruimte** en voer Doctor daarna eenmaal uit:

    1. Installeer OpenClaw op de nieuwe machine.
    2. Kopieer `$OPENCLAW_STATE_DIR` (standaard: `~/.openclaw`) van de oude machine.
    3. Kopieer je werkruimte (standaard: `~/.openclaw/workspace`).
    4. Voer `openclaw doctor` uit en start de Gateway-service opnieuw.

    Hiermee blijven de configuratie, authenticatieprofielen, WhatsApp-referenties, sessies en
    het geheugen behouden. Je bot blijft exact hetzelfde, zolang je **beide** locaties kopieert.
    In de externe modus beheert de Gateway-host de sessieopslag en werkruimte.

    **Belangrijk:** als je alleen je werkruimte naar GitHub commit/pusht, maak je een back-up van
    **geheugen + bootstrapbestanden**, maar niet van de sessiegeschiedenis of authenticatie. Die staan onder
    `~/.openclaw/` (bijvoorbeeld `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Gerelateerd: [Migreren](/nl/install/migrating), [Waar alles op schijf staat](/nl/help/faq#where-things-live-on-disk),
    [Agentwerkruimte](/nl/concepts/agent-workspace), [Doctor](/nl/gateway/doctor),
    [Externe modus](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Waar kan ik zien wat er nieuw is in de nieuwste versie?">
    Bekijk de changelog op GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    De nieuwste vermeldingen staan bovenaan. Als de bovenste sectie **Niet uitgebracht** is,
    is de volgende gedateerde sectie de laatst uitgebrachte versie. Vermeldingen worden gegroepeerd
    onder **Hoogtepunten**, **Wijzigingen** en **Oplossingen** (plus documentatie-/andere secties indien nodig).

  </Accordion>

  <Accordion title="Geen toegang tot docs.openclaw.ai (SSL-fout)">
    Sommige Comcast-/Xfinity-verbindingen blokkeren `docs.openclaw.ai` ten onrechte via Xfinity
    Advanced Security. Schakel dit uit of voeg `docs.openclaw.ai` toe aan de toelatingslijst en
    probeer het opnieuw. Help ons de blokkering op te heffen:
    [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Nog steeds geblokkeerd? De documentatie wordt gespiegeld op GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Verschil tussen stable en beta">
    **Stable** en **beta** zijn **npm-dist-tags**, geen afzonderlijke codelijnen:

    - `latest` = stable
    - `beta` = vroege build om te testen (valt terug op `latest` wanneer beta ontbreekt of ouder is dan de huidige stable-release)

    Een stable-release verschijnt meestal eerst op **beta**, waarna een expliciete promotiestap
    diezelfde versie naar `latest` verplaatst zonder het versienummer te wijzigen. Onderhouders
    kunnen ook rechtstreeks naar `latest` publiceren. Daarom kunnen beta en stable na promotie
    naar **dezelfde versie** verwijzen.

    Bekijk wat er is gewijzigd: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Zie het volgende uitklapgedeelte voor installatieopdrachten van één regel en het verschil tussen beta en dev.

  </Accordion>

  <Accordion title="Hoe installeer ik de betaversie en wat is het verschil tussen beta en dev?">
    **Beta** is de npm-dist-tag `beta` (kan na promotie overeenkomen met `latest`).
    **Dev** is de steeds veranderende kop van `main` (git); wanneer deze naar npm wordt gepubliceerd, gebruikt die dist-tag `dev`.

    Opdrachten van één regel (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-installatieprogramma (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Meer informatie: [Ontwikkelingskanalen](/nl/install/development-channels) en [Installatieopties](/nl/install/installer).

  </Accordion>

  <Accordion title="Hoe probeer ik de nieuwste wijzigingen?">
    Twee opties:

    1. **Dev-kanaal (bestaande installatie):**

    ```bash
    openclaw update --channel dev
    ```

    Hiermee wordt overgeschakeld naar een git-checkout van `main`, wordt deze gerebased op upstream, gebouwd en wordt
    de CLI vanuit die checkout geïnstalleerd.

    2. **Aanpasbare (git-)installatie (nieuwe machine):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Geef de voorkeur aan handmatig klonen:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentatie: [Bijwerken](/nl/cli/update), [Ontwikkelingskanalen](/nl/install/development-channels), [Installeren](/nl/install).

  </Accordion>

  <Accordion title="Hoelang duren de installatie en onboarding doorgaans?">
    Globale indicatie:

    - **Installatie:** 2-5 minuten.
    - **QuickStart-onboarding:** enkele minuten (loopback-Gateway, automatisch token, standaardwerkruimte).
    - **Geavanceerde/volledige onboarding:** langer wanneer aanmelding bij een provider, kanaalkoppeling, daemoninstallatie, netwerkdownloads of Skills extra configuratie vereisen.

    De wizard toont deze tijdlijn vooraf. Sla optionele stappen over en keer later terug met
    `openclaw configure`.

    Blijft het hangen? Zie hierboven [Ik zit vast](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Loopt het installatieprogramma vast? Hoe krijg ik meer feedback?">
    Voer het opnieuw uit met `--verbose`:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` heeft geen afzonderlijke optie voor uitgebreide uitvoer; voer het in plaats daarvan uit via `Set-PSDebug -Trace 1` /
    `-Trace 0`. Volledig overzicht van opties: [Installatieopties](/nl/install/installer).

  </Accordion>

  <Accordion title="De Windows-installatie meldt dat git niet is gevonden of openclaw niet wordt herkend">
    Twee veelvoorkomende Windows-problemen:

    **1) npm-fout spawn git / git niet gevonden**

    - Installeer **Git for Windows** en zorg dat `git` in PATH staat.
    - Sluit PowerShell, open het opnieuw en voer het installatieprogramma nogmaals uit.

    **2) openclaw wordt na installatie niet herkend**

    - De globale npm-binmap staat niet in PATH.
    - Controleer dit: `npm config get prefix`.
    - Voeg die map toe aan je gebruikers-PATH (het achtervoegsel `\bin` is niet nodig; op de meeste systemen is dit `%AppData%\npm`).
    - Sluit PowerShell en open het opnieuw.

    Liever een desktopapp? Gebruik **Windows Hub**. Voor configuratie via alleen de terminal worden zowel het PowerShell-
    installatieprogramma als WSL2-Gateway-paden ondersteund. Documentatie: [Windows](/nl/platforms/windows).

  </Accordion>

  <Accordion title="De uitvoer van Windows exec toont verminkte Chinese tekst — wat moet ik doen?">
    Dit wordt meestal veroorzaakt door een niet-overeenkomende consolecodepagina in systeemeigen Windows-shells.

    Symptomen: uitvoer van `system.run`/`exec` geeft Chinees als onleesbare tekens weer; dezelfde opdracht
    ziet er in een ander terminalprofiel wel goed uit.

    Tijdelijke oplossing in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Start vervolgens de Gateway opnieuw en probeer het nogmaals:

    ```powershell
    openclaw gateway restart
    ```

    Treedt dit nog steeds op in de nieuwste OpenClaw? Volg of meld het hier: [Issue #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="De documentatie heeft mijn vraag niet beantwoord — hoe krijg ik een beter antwoord?">
    Gebruik de aanpasbare (git-)installatie zodat je de volledige broncode en documentatie lokaal hebt en stel je vraag vervolgens
    **vanuit die map** aan je bot (of Claude/Codex), zodat die de repository kan lezen en een nauwkeurig antwoord kan geven.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Meer informatie: [Installeren](/nl/install) en [Installatieopties](/nl/install/installer).

  </Accordion>

  <Accordion title="Hoe installeer ik OpenClaw op Linux?">
    - Snel aan de slag met Linux + service-installatie: [Linux](/nl/platforms/linux).
    - Volledige stapsgewijze handleiding: [Aan de slag](/nl/start/getting-started).
    - Installatieprogramma + updates: [Installatie en updates](/nl/install/updating).

  </Accordion>

  <Accordion title="Hoe installeer ik OpenClaw op een VPS?">
    Elke Linux-VPS is geschikt. Installeer het op de server en maak vervolgens via SSH/Tailscale verbinding met de Gateway.

    Handleidingen: [exe.dev](/nl/install/exe-dev), [Hetzner](/nl/install/hetzner), [Fly.io](/nl/install/fly).
    Externe toegang: [Externe Gateway](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Waar vind ik de installatiehandleidingen voor cloud/VPS?">
    Hostingoverzicht met veelgebruikte providers:

    - [VPS-hosting](/nl/vps) (alle providers op één plek)
    - [Fly.io](/nl/install/fly)
    - [Hetzner](/nl/install/hetzner)
    - [exe.dev](/nl/install/exe-dev)

    In de cloud **draait de Gateway op de server** en heb je vanaf je laptop/telefoon
    toegang via de Control UI (of Tailscale/SSH). Je status + werkruimte bevinden zich op de server, dus
    beschouw de host als de bron van waarheid en maak er een back-up van.

    Koppel **nodes** (Mac/iOS/Android/headless) aan die cloud-Gateway voor lokale
    scherm-/camera-/canvasfuncties of om opdrachten op je laptop uit te voeren terwijl de Gateway in
    de cloud blijft.

    Overzicht: [Platformen](/nl/platforms). Externe toegang: [Externe Gateway](/nl/gateway/remote).
    Nodes: [Nodes](/nl/nodes), [Nodes-CLI](/nl/cli/nodes).

  </Accordion>

  <Accordion title="Kan ik OpenClaw vragen zichzelf bij te werken?">
    Mogelijk, maar niet aanbevolen. Het updateproces kan de Gateway opnieuw starten (waardoor de
    actieve sessie wordt verbroken), kan een schone git-checkout vereisen en kan om bevestiging vragen.
    Het is veiliger om updates als beheerder vanuit een shell uit te voeren.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Automatiseren vanuit een agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentatie: [Bijwerken](/nl/cli/update), [Updates uitvoeren](/nl/install/updating).

  </Accordion>

  <Accordion title="Wat doet onboarding precies?">
    `openclaw onboard` is het aanbevolen configuratiepad. In **lokale modus** doorloop je:

    1. **Model/authenticatie** - OAuth van de provider, API-sleutels of handmatige authenticatie (inclusief lokale opties zoals LM Studio); kies een standaardmodel.
    2. **Werkruimte** - locatie + bootstrapbestanden.
    3. **Gateway** - poort, bindadres, authenticatiemodus, beschikbaarstelling via Tailscale.
    4. **Kanalen** - ingebouwde en officiële Plugin-chatkanalen: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp en meer.
    5. **Daemon** - LaunchAgent (macOS), systemd-gebruikerseenheid (Linux/WSL2) of systeemeigen geplande Windows-taak.
    6. **Statuscontrole** - start de Gateway en controleert of deze actief is.
    7. **Skills** - installeert aanbevolen Skills en optionele afhankelijkheden.

    Vooraf worden verwachtingen over de duur gegeven en verschijnt een waarschuwing als je geconfigureerde model onbekend is
    of authenticatie ontbreekt. Volledig overzicht: [Onboarding (CLI)](/nl/start/wizard).

  </Accordion>

  <Accordion title="Heb ik een abonnement op Claude of OpenAI nodig om dit uit te voeren?">
    Nee. Voer OpenClaw uit met **API-sleutels** (Anthropic/OpenAI/andere) of **uitsluitend lokale modellen**,
    zodat je gegevens op je apparaat blijven. Abonnementen (Claude Pro/Max, ChatGPT/Codex) zijn
    optionele manieren om je bij deze providers te authenticeren.

    Voor Anthropic biedt een **API-sleutel** de standaardfacturering op basis van gebruik; **Claude CLI**
    hergebruikt een bestaande Claude Code-aanmelding op dezelfde host. Anthropic behandelt momenteel
    het niet-interactieve `claude -p`-pad van Claude CLI als gebruik van de Agent SDK/programmatisch gebruik dat
    nog steeds meetelt voor de limieten van je abonnement. Controleer de actuele
    facturatiedocumentatie van Anthropic voordat je op dit abonnementsgedrag vertrouwt. Voor langdurig gebruikte Gateway-hosts en gedeelde
    automatisering is een Anthropic-API-sleutel de voorspelbaardere keuze.

    OpenAI Codex OAuth (ChatGPT/Codex-abonnement) wordt volledig ondersteund voor agentmodellen.
    OpenClaw ondersteunt ook gehoste abonnementsopties, waaronder **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** en **Z.AI / GLM Coding Plan**.

    Documentatie: [Anthropic](/nl/providers/anthropic), [OpenAI](/nl/providers/openai),
    [Qwen Cloud](/nl/providers/qwen), [MiniMax](/nl/providers/minimax), [Z.AI (GLM)](/nl/providers/zai),
    [Lokale modellen](/nl/gateway/local-models), [Modellen](/nl/concepts/models).

  </Accordion>

  <Accordion title="Kan ik een Claude Max-abonnement zonder API-sleutel gebruiken?">
    Ja. OpenClaw ondersteunt hergebruik van Claude CLI voor Pro-/Max-/Team-/Enterprise-abonnementen. Anthropic
    behandelt het door OpenClaw gebruikte `claude -p`-pad momenteel als gebruik binnen het abonnement,
    onderworpen aan de limieten van je abonnement, en niet als een afzonderlijk gratis tegoed. Zie
    [Anthropic](/nl/providers/anthropic) voor de actuele factureringsinformatie en links naar
    de eigen ondersteuningsartikelen van Anthropic. Gebruik in plaats daarvan een
    Anthropic-API-sleutel voor de meest voorspelbare configuratie aan de serverzijde.
  </Accordion>

  <Accordion title="Ondersteunen jullie authenticatie via een Claude-abonnement (Claude Pro of Max)?">
    Ja, via hergebruik van Claude CLI. De factureringswijze van Anthropic voor `claude -p`/Agent SDK-gebruik
    is in de loop der tijd gewijzigd; zie [Anthropic](/nl/providers/anthropic) voor de actuele situatie en
    gedateerde links naar de ondersteuningsartikelen van Anthropic voordat je op specifiek factureringsgedrag
    vertrouwt.

    Anthropic-authenticatie met een setup-token is ook nog steeds een ondersteund tokenpad, maar OpenClaw geeft waar mogelijk de voorkeur aan
    hergebruik van de Claude CLI en `claude -p`. Voor productie- of multi-userworkloads
    blijft een Anthropic API-sleutel de veiligere, beter voorspelbare keuze. Andere
    gehoste opties met een abonnementsmodel: [OpenAI](/nl/providers/openai), [Qwen Cloud](/nl/providers/qwen),
    [MiniMax](/nl/providers/minimax), [Z.AI (GLM)](/nl/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Waarom krijg ik HTTP 429 rate_limit_error van Anthropic te zien?">
    Je **Anthropic-quotum/snelheidslimiet** is voor het huidige tijdsvenster uitgeput. Wacht bij **Claude
    CLI** tot het venster opnieuw wordt ingesteld of upgrade je abonnement. Controleer bij een **Anthropic API-sleutel**
    het gebruik en de facturering in de Anthropic Console en verhoog waar nodig de limieten.

    Als het bericht specifiek `Extra usage is required for long context requests` is,
    probeert het verzoek Anthropics contextvenster van 1M te gebruiken (een voor algemene beschikbaarheid geschikt 1M Claude 4.x-
    model, of verouderde `params.context1m: true`-configuratie), en komen je huidige aanmeldgegevens niet
    in aanmerking voor facturering van lange context.

    Stel een **fallbackmodel** in zodat OpenClaw blijft antwoorden terwijl de snelheidslimiet van een provider is bereikt.
    Zie [Modellen](/nl/cli/models), [OAuth](/nl/concepts/oauth) en
    [Voor lange context vereist Anthropic 429 extra gebruik](/nl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wordt AWS Bedrock ondersteund?">
    Ja. OpenClaw heeft een meegeleverde **Amazon Bedrock (Converse)**-provider. Wanneer AWS-omgevingsmarkeringen
    aanwezig zijn (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    schakelt OpenClaw automatisch de impliciete Bedrock-provider in voor modeldetectie; stel anders
    `plugins.entries.amazon-bedrock.config.discovery.enabled: true` in of voeg handmatig een
    providervermelding toe. Zie [Amazon Bedrock](/nl/providers/bedrock) en [Modelproviders](/nl/providers/models).
    Een OpenAI-compatibele proxy vóór Bedrock blijft een geldige optie als je de voorkeur geeft aan een beheerde sleutelstroom.
  </Accordion>

  <Accordion title="Hoe werkt Codex-authenticatie?">
    OpenClaw ondersteunt **OpenAI Codex** via OAuth (aanmelden bij ChatGPT). Een nieuwe
    configuratie zonder primair model gebruikt exact `openai/gpt-5.6-sol` voor
    ChatGPT/Codex-abonnementsauthenticatie plus systeemeigen uitvoering via de Codex-appserver.
    Bij herauthenticatie blijft een bestaand expliciet model behouden, inclusief
    `openai/gpt-5.5`. Als de Codex-werkruimte GPT-5.6 niet aanbiedt, selecteer dan
    expliciet `openai/gpt-5.5`; OpenClaw schaalt niet stilzwijgend terug. Verouderde
    modelverwijzingen met een Codex-voorvoegsel zijn verouderde configuratie die door `openclaw doctor
    --fix` wordt hersteld. Directe toegang met een OpenAI API-sleutel blijft beschikbaar voor OpenAI
    API-oppervlakken zonder agent en, via een geordend `openai`-API-sleutelprofiel, ook voor agentmodellen.
    Zie [Modelproviders](/nl/concepts/model-providers) en
    [Onboarding (CLI)](/nl/start/wizard).
  </Accordion>

  <Accordion title="Waarom vermeldt OpenClaw nog steeds het verouderde OpenAI Codex-voorvoegsel?">
    `openai` is de huidige provider- en authenticatieprofiel-id voor zowel OpenAI API-sleutels als
    ChatGPT/Codex OAuth - OpenAI Codex is hierin opgenomen. Je kunt in oudere configuratie en migratiewaarschuwingen
    nog steeds een verouderd `openai-codex`-voorvoegsel tegenkomen:

    - `openai/gpt-5.6-sol` = nieuwe ChatGPT/Codex-abonnementsconfiguratie met de systeemeigen Codex-runtime voor agentbeurten.
    - `openai/gpt-5.5` = expliciete ondersteunde selectie voor bestaande configuratie of accounts zonder toegang tot GPT-5.6.
    - Verouderde `openai-codex/*`-modelverwijzingen = verouderde route die door `openclaw doctor --fix` wordt hersteld.
    - `openai/gpt-5.5` plus een geordend `openai`-API-sleutelprofiel = authenticatie met een API-sleutel voor een OpenAI-agentmodel.
    - Verouderde `openai-codex`-authenticatieprofiel-id's = verouderde id's die door `openclaw doctor --fix` worden gemigreerd.

    Wil je directe facturering via het OpenAI Platform? Stel `OPENAI_API_KEY` in. Wil je ChatGPT/Codex-
    abonnementsauthenticatie? Voer `openclaw models auth login --provider openai` uit. Houd
    modelverwijzingen onder de canonieke provider `openai/*`. Nieuwe abonnementsconfiguraties
    gebruiken exact `openai/gpt-5.6-sol`; doctor herstelt verouderde verwijzingen met een Codex-voorvoegsel
    zonder een expliciete selectie van `openai/gpt-5.5` te upgraden.

  </Accordion>

  <Accordion title="Waarom kunnen de OAuth-limieten van Codex afwijken van die van ChatGPT op het web?">
    Codex OAuth gebruikt door OpenAI beheerde, abonnementsafhankelijke quotumvensters die kunnen afwijken van de
    ervaring op de ChatGPT-website/app, zelfs met hetzelfde account.

    `openclaw models status` toont de momenteel zichtbare gebruiks-/quotumvensters van de provider, maar
    bedenkt of normaliseert ChatGPT-webrechten niet tot directe API-toegang. Gebruik voor
    directe facturering/limieten van het OpenAI Platform `openai/*` met een API-sleutel.

  </Accordion>

  <Accordion title="Ondersteunen jullie OpenAI-abonnementsauthenticatie (Codex OAuth)?">
    Ja, volledig. OpenAI staat expliciet het gebruik van OAuth voor abonnementen toe in externe
    tools/workflows zoals OpenClaw. Onboarding kan de OAuth-stroom voor je uitvoeren.

    Zie [OAuth](/nl/concepts/oauth), [Modelproviders](/nl/concepts/model-providers) en [Onboarding (CLI)](/nl/start/wizard).

  </Accordion>

  <Accordion title="Hoe stel ik Gemini CLI OAuth in?">
    Gemini CLI gebruikt een **authenticatiestroom via een plugin**, geen client-id of geheim in `openclaw.json`.

    1. Installeer Gemini CLI lokaal zodat `gemini` zich in `PATH` bevindt:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Schakel de plugin in: `openclaw plugins enable google`
    3. Meld je aan: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standaardmodel na het aanmelden: `google/gemini-3.1-pro-preview` (runtime `google-gemini-cli`)
    5. Mislukken verzoeken na het aanmelden? Stel `GOOGLE_CLOUD_PROJECT` of `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host en probeer het opnieuw.

    OAuth-tokens worden opgeslagen in authenticatieprofielen op de Gateway-host. Details: [Google](/nl/providers/google), [Modelproviders](/nl/concepts/model-providers).

  </Accordion>

  <Accordion title="Is een lokaal model geschikt voor informele chats?">
    Meestal niet. OpenClaw heeft een grote context en sterke beveiliging nodig; kleine kaarten kappen de context af
    en slaan beveiligingsfilters aan de providerzijde over. Als het echt moet, voer dan lokaal de **grootste** modelbuild uit die
    je kunt gebruiken (LM Studio) - zie [Lokale modellen](/nl/gateway/local-models). Kleinere/gekwantiseerde
    modellen verhogen het risico op promptinjectie - zie [Beveiliging](/nl/gateway/security).
  </Accordion>

  <Accordion title="Hoe houd ik verkeer naar gehoste modellen binnen een specifieke regio?">
    Kies eindpunten die aan een regio zijn gebonden. OpenRouter biedt in de VS gehoste opties voor MiniMax, Kimi
    en GLM; kies de in de VS gehoste variant om gegevens binnen de regio te houden. Je kunt daarnaast
    Anthropic/OpenAI vermelden met `models.mode: "merge"`, zodat fallbacks
    beschikbaar blijven terwijl de door jou gekozen regionale provider wordt gerespecteerd.
  </Accordion>

  <Accordion title="Moet ik een Mac mini kopen om dit te installeren?">
    Nee. OpenClaw draait op macOS of Linux (Windows via WSL2). Een Mac mini is een populaire
    keuze als altijd ingeschakelde host, maar een kleine VPS, thuisserver of apparaat in de klasse van een Raspberry Pi werkt ook.

    Je hebt alleen een Mac nodig **voor tools die uitsluitend op macOS werken**. Gebruik voor iMessage [iMessage](/nl/channels/imessage)
    met `imsg` op een willekeurige Mac die bij Berichten is aangemeld - als de Gateway op Linux of elders draait,
    stel je `channels.imessage.cliPath` in op een SSH-wrapper die `imsg` op die Mac uitvoert. Voer voor andere
    tools die uitsluitend op macOS werken de Gateway uit op een Mac of koppel een macOS-node.

    Documentatie: [iMessage](/nl/channels/imessage), [Nodes](/nl/nodes), [Externe modus voor Mac](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Heb ik een Mac mini nodig voor ondersteuning van iMessage?">
    Je hebt **een macOS-apparaat** nodig dat bij Berichten is aangemeld - dit hoeft geen Mac mini te zijn, elke
    Mac werkt. Gebruik [iMessage](/nl/channels/imessage) met `imsg`; de Gateway kan op die
    Mac draaien, of elders met een SSH-wrapper `cliPath`.

    Gebruikelijke configuraties:

    - Gateway op Linux/VPS, waarbij `channels.imessage.cliPath` is ingesteld op een SSH-wrapper die `imsg` uitvoert op een Mac die bij Berichten is aangemeld.
    - Alles op één Mac voor de eenvoudigste configuratie met één machine.

    Documentatie: [iMessage](/nl/channels/imessage), [Nodes](/nl/nodes), [Externe modus voor Mac](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Als ik een Mac mini koop om OpenClaw uit te voeren, kan ik die dan met mijn MacBook Pro verbinden?">
    Ja. De **Mac mini kan de Gateway uitvoeren** en je MacBook Pro maakt verbinding als een **node**
    (begeleidend apparaat). Nodes voeren de Gateway niet uit - ze voegen mogelijkheden toe zoals
    scherm/camera/canvas en `system.run` op dat apparaat.

    Gebruikelijk patroon: de Gateway draait op de altijd ingeschakelde Mac mini; de MacBook Pro voert de macOS-app of een
    nodehost uit en wordt aan de Gateway gekoppeld. Controleer dit met `openclaw nodes status` / `openclaw nodes list`.

    Documentatie: [Nodes](/nl/nodes), [Nodes-CLI](/nl/cli/nodes).

  </Accordion>

  <Accordion title="Kan ik Bun gebruiken?">
    Je kunt Bun gebruiken om afhankelijkheden te installeren of pakketscripts uit te voeren. De OpenClaw CLI en
    Gateway vereisen **Node**, omdat de canonieke statusopslag `node:sqlite` gebruikt; Bun biedt
    die API niet.
  </Accordion>

  <Accordion title="Telegram: wat hoort er in allowFrom?">
    `channels.telegram.allowFrom` is de **Telegram-gebruikers-id van de menselijke afzender** (numeriek),
    niet de gebruikersnaam van de bot. De configuratie vraagt alleen om numerieke gebruikers-id's; `openclaw doctor --fix`
    kan proberen verouderde `@username`-vermeldingen op te lossen.

    Veiliger (geen bot van derden): stuur je bot een privébericht, voer `openclaw logs --follow` uit en lees `from.id`.

    Officiële Bot API: stuur je bot een privébericht, roep `https://api.telegram.org/bot<bot_token>/getUpdates` aan en lees `message.from.id`.

    Derde partij (minder privé): stuur `@userinfobot` of `@getidsbot` een privébericht.

    Zie [Toegangsbeheer voor Telegram](/nl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Kunnen meerdere mensen één WhatsApp-nummer gebruiken met verschillende OpenClaw-instanties?">
    Ja, via **routering met meerdere agents**. Koppel het WhatsApp-privébericht van elke afzender (`peer: { kind: "direct", id: "+15551234567" }`) aan een andere `agentId`, zodat elke persoon een eigen werkruimte en sessieopslag krijgt. Antwoorden komen nog steeds van **hetzelfde WhatsApp-account**; toegangsbeheer voor privéberichten (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) is globaal per account. Zie [Routering met meerdere agents](/nl/concepts/multi-agent) en [WhatsApp](/nl/channels/whatsapp).
  </Accordion>

  <Accordion title='Kan ik een agent voor "snel chatten" en een agent met "Opus voor programmeren" uitvoeren?'>
    Ja. Gebruik routering met meerdere agents: geef elke agent een eigen standaardmodel en koppel vervolgens inkomende
    routes (provideraccount of specifieke peers) aan elke agent. Voorbeeldconfiguratie:
    [Routering met meerdere agents](/nl/concepts/multi-agent). Zie ook [Modellen](/nl/concepts/models) en
    [Configuratie](/nl/gateway/configuration).
  </Accordion>

  <Accordion title="Werkt Homebrew op Linux?">
    Ja, via Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Als je OpenClaw via systemd uitvoert: zorg ervoor dat het PATH van de service
    `/home/linuxbrew/.linuxbrew/bin` (of je brew-voorvoegsel) bevat, zodat met `brew` geïnstalleerde tools
    in niet-aanmeldshells kunnen worden gevonden. Recente builds voegen ook veelgebruikte binaire gebruikersmappen vooraan toe aan Linux-
    systemd-services (bijvoorbeeld `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) en respecteren `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` en `FNM_DIR` wanneer deze zijn ingesteld.

  </Accordion>

  <Accordion title="Verschil tussen de aanpasbare git-installatie en npm-installatie">
    - **Aanpasbare installatie (git):** volledige checkout van de broncode, bewerkbaar, het geschiktst voor bijdragers. Je bouwt lokaal en kunt code/documentatie aanpassen.
    - **npm-installatie:** globale CLI-installatie, geen repository, het geschiktst om het "gewoon uit te voeren". Updates komen via npm-dist-tags.

    Documentatie: [Aan de slag](/nl/start/getting-started), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Kan ik later wisselen tussen npm- en git-installaties?">
    Ja, met `openclaw update --channel ...` op een bestaande installatie. Hierdoor worden **je gegevens
    niet verwijderd**; alleen de installatie van de OpenClaw-code verandert. De status (`~/.openclaw`) en
    werkruimte (`~/.openclaw/workspace`) blijven ongewijzigd.

    Van npm naar git:

    ```bash
    openclaw update --channel dev
    ```

    Van git naar npm:

    ```bash
    openclaw update --channel stable
    ```

    Voeg `--dry-run` toe om eerst een voorbeeld van de geplande moduswissel te bekijken. De updater voert
    vervolgstappen van Doctor uit, vernieuwt Plugin-bronnen voor het doelkanaal en start de Gateway
    opnieuw, tenzij je `--no-restart` meegeeft.

    Het installatieprogramma kan beide modi ook afdwingen:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Back-uptips: [Waar alles op de schijf staat](/nl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Moet ik de Gateway op mijn laptop of op een VPS uitvoeren?">
    Wil je 24/7-betrouwbaarheid? Gebruik een **VPS**. Wil je zo min mogelijk gedoe en vind je
    slaapstand/herstarts geen probleem? Voer de Gateway lokaal uit.

    **Laptop (lokale Gateway)**

    - **Voordelen:** geen serverkosten, directe toegang tot lokale bestanden, een zichtbaar browservenster.
    - **Nadelen:** slaapstand/netwerkuitval verbreekt de verbinding, OS-updates/herstarts onderbreken de Gateway, de laptop moet actief blijven.

    **VPS / cloud**

    - **Voordelen:** altijd actief, stabiel netwerk, geen problemen met de slaapstand van een laptop, eenvoudiger continu actief te houden.
    - **Nadelen:** vaak zonder grafische interface (gebruik schermafbeeldingen), alleen externe bestandstoegang, SSH vereist voor updates.

    WhatsApp/Telegram/Slack/Mattermost/Discord werken allemaal prima vanaf een VPS; de werkelijke
    afweging is een browser zonder grafische interface versus een zichtbaar venster. Zie [Browser](/nl/tools/browser).

    Standaardadvies: gebruik een VPS als de Gateway eerder verbindingen heeft verloren; lokaal werkt uitstekend
    wanneer je de Mac actief gebruikt en toegang tot lokale bestanden of UI-automatisering
    met een zichtbare browser wilt.

  </Accordion>

  <Accordion title="Hoe belangrijk is het om OpenClaw op een afzonderlijke machine uit te voeren?">
    Niet vereist, maar wel aanbevolen voor betrouwbaarheid en isolatie.

    - **Afzonderlijke host (VPS/Mac mini/Raspberry Pi):** altijd actief, minder onderbrekingen door slaapstand/herstarts, overzichtelijkere machtigingen, eenvoudiger continu actief te houden.
    - **Gedeelde laptop/desktop:** prima voor testen en actief gebruik, maar houd rekening met onderbrekingen wanneer de machine in de slaapstand gaat of wordt bijgewerkt.

    Het beste van twee werelden: houd de Gateway op een afzonderlijke host en koppel je laptop als een
    **Node** voor lokale scherm-, camera- en uitvoeringstools. Zie [Nodes](/nl/nodes) en [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Wat zijn de minimale VPS-vereisten en welk OS wordt aanbevolen?">
    - **Absoluut minimum:** 1 vCPU, 1 GB RAM, ~500 MB schijfruimte.
    - **Aanbevolen:** 1-2 vCPU, 2 GB+ RAM voor extra capaciteit (logboeken, media, meerdere kanalen). Node-tools en browserautomatisering kunnen veel systeembronnen verbruiken.

    OS: **Ubuntu LTS** (of een moderne versie van Debian/Ubuntu) — het grondigst geteste Linux-installatiepad.

    Documentatie: [Linux](/nl/platforms/linux), [VPS-hosting](/nl/vps).

  </Accordion>

  <Accordion title="Kan ik OpenClaw in een VM uitvoeren en wat zijn de vereisten?">
    Ja. Behandel een VM als een VPS: deze moet altijd actief en bereikbaar zijn en voldoende RAM
    hebben voor de Gateway en alle kanalen die je inschakelt.

    - **Absoluut minimum:** 1 vCPU, 1 GB RAM.
    - **Aanbevolen:** 2 GB+ RAM voor meerdere kanalen, browserautomatisering of mediatools.
    - **OS:** Ubuntu LTS of een andere moderne versie van Debian/Ubuntu.

    Gebruik op Windows **Windows Hub** voor de desktopinstallatie, of WSL2 voor een Linux-achtige Gateway-VM
    met brede compatibiliteit voor tools. Zie [Windows](/nl/platforms/windows), [VPS-hosting](/nl/vps).
    macOS uitvoeren in een VM: zie [macOS-VM](/nl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Veelgestelde vragen](/nl/help/faq) - de belangrijkste veelgestelde vragen (modellen, sessies, Gateway, beveiliging en meer)
- [Installatieoverzicht](/nl/install)
- [Aan de slag](/nl/start/getting-started)
- [Problemen oplossen](/nl/help/troubleshooting)
