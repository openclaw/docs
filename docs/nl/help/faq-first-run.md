---
read_when:
    - Nieuwe installatie, vastgelopen introductieproces of fouten bij de eerste start
    - Authenticatie en providerabonnementen kiezen
    - Kan docs.openclaw.ai niet bereiken, kan dashboard niet openen, installatie blijft hangen
sidebarTitle: First-run FAQ
summary: 'Veelgestelde vragen: snelstart en configuratie bij eerste gebruik — installatie, onboarding, authenticatie, abonnementen, initiële fouten'
title: 'Veelgestelde vragen: configuratie bij eerste gebruik'
x-i18n:
    generated_at: "2026-05-07T13:19:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  Q&A voor snelle start en eerste gebruik. Voor dagelijkse bewerkingen, modellen, authenticatie, sessies
  en probleemoplossing, zie de hoofd-[FAQ](/nl/help/faq).

  ## Snelle start en eerste installatie

  <AccordionGroup>
  <Accordion title="Ik zit vast, snelste manier om verder te komen">
    Gebruik een lokale AI-agent die **je machine kan zien**. Dat is veel effectiever dan vragen
    in Discord, omdat de meeste gevallen van "ik zit vast" **lokale configuratie- of omgevingsproblemen** zijn die
    hulp op afstand niet kan inspecteren.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Deze tools kunnen de repo lezen, opdrachten uitvoeren, logs inspecteren en helpen je installatie op machineniveau
    te repareren (PATH, services, machtigingen, authenticatiebestanden). Geef ze de **volledige source checkout** via
    de hackbare (git-)installatie:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Hiermee installeer je OpenClaw **vanuit een git checkout**, zodat de agent de code en docs kan lezen en
    kan redeneren over de exacte versie die je draait. Je kunt later altijd terugschakelen naar stable
    door het installatieprogramma opnieuw uit te voeren zonder `--install-method git`.

    Tip: vraag de agent om de oplossing **te plannen en te begeleiden** (stap voor stap), en voer daarna alleen de
    noodzakelijke opdrachten uit. Zo blijven wijzigingen klein en makkelijker te controleren.

    Als je een echte bug of fix ontdekt, dien dan een GitHub-issue in of stuur een PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Begin met deze opdrachten (deel de uitvoer wanneer je om hulp vraagt):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Wat ze doen:

    - `openclaw status`: snelle momentopname van gateway-/agentstatus en basisconfiguratie.
    - `openclaw models status`: controleert provider-authenticatie en modelbeschikbaarheid.
    - `openclaw doctor`: valideert en repareert veelvoorkomende configuratie-/statusproblemen.

    Andere nuttige CLI-controles: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Snelle debuglus: [Eerste 60 seconden als iets kapot is](/nl/help/faq#first-60-seconds-if-something-is-broken).
    Installatiedocs: [Installeren](/nl/install), [Installatievlaggen](/nl/install/installer), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat blijft overslaan. Wat betekenen de redenen voor overslaan?">
    Veelvoorkomende redenen waarom Heartbeat overslaat:

    - `quiet-hours`: buiten het geconfigureerde venster voor actieve uren
    - `empty-heartbeat-file`: `HEARTBEAT.md` bestaat, maar bevat alleen lege scaffolding of alleen koppen
    - `no-tasks-due`: `HEARTBEAT.md`-taakmodus is actief, maar geen van de taakintervallen is al aan de beurt
    - `alerts-disabled`: alle Heartbeat-zichtbaarheid is uitgeschakeld (`showOk`, `showAlerts` en `useIndicator` staan allemaal uit)

    In taakmodus worden tijdstempels die aan de beurt zijn alleen bijgewerkt nadat een echte Heartbeat-run
    is voltooid. Overgeslagen runs markeren taken niet als voltooid.

    Docs: [Heartbeat](/nl/gateway/heartbeat), [Automatisering en taken](/nl/automation).

  </Accordion>

  <Accordion title="Aanbevolen manier om OpenClaw te installeren en in te stellen">
    De repo raadt aan om vanuit source te draaien en onboarding te gebruiken:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    De wizard kan ook automatisch UI-assets bouwen. Na onboarding draai je de Gateway meestal op poort **18789**.

    Vanuit source (contributors/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Als je nog geen globale installatie hebt, voer dit dan uit via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Hoe open ik het dashboard na onboarding?">
    De wizard opent direct na onboarding je browser met een schone dashboard-URL (zonder token) en toont de link ook in de samenvatting. Houd dat tabblad open; als het niet is gestart, kopieer/plak dan de weergegeven URL op dezelfde machine.
  </Accordion>

  <Accordion title="Hoe authenticeer ik het dashboard op localhost versus remote?">
    **Localhost (dezelfde machine):**

    - Open `http://127.0.0.1:18789/`.
    - Als er om shared-secret-authenticatie wordt gevraagd, plak dan het geconfigureerde token of wachtwoord in de Control UI-instellingen.
    - Tokenbron: `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
    - Wachtwoordbron: `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
    - Als er nog geen shared secret is geconfigureerd, genereer dan een token met `openclaw doctor --generate-gateway-token`.

    **Niet op localhost:**

    - **Tailscale Serve** (aanbevolen): houd bind op local loopback, voer `openclaw gateway --tailscale serve` uit, open `https://<magicdns>/`. Als `gateway.auth.allowTailscale` `true` is, voldoen identity-headers aan Control UI-/WebSocket-authenticatie (geen geplakte shared secret, gaat uit van vertrouwde gateway-host); HTTP-API's vereisen nog steeds shared-secret-authenticatie, tenzij je bewust private-ingress `none` of trusted-proxy HTTP-authenticatie gebruikt.
      Slechte gelijktijdige Serve-authenticatiepogingen van dezelfde client worden geserialiseerd voordat de failed-auth-limiter ze registreert, waardoor de tweede slechte nieuwe poging al `retry later` kan tonen.
    - **Tailnet-bind**: voer `openclaw gateway --bind tailnet --token "<token>"` uit (of configureer wachtwoordauthenticatie), open `http://<tailscale-ip>:18789/` en plak daarna de bijbehorende shared secret in de dashboardinstellingen.
    - **Identity-aware reverse proxy**: houd de Gateway achter een vertrouwde proxy, configureer `gateway.auth.mode: "trusted-proxy"` en open daarna de proxy-URL. Same-host loopback-proxy's vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`. Shared-secret-authenticatie blijft gelden via de tunnel; plak het geconfigureerde token of wachtwoord als daarom wordt gevraagd.

    Zie [Dashboard](/nl/web/dashboard) en [Web-oppervlakken](/nl/web) voor bind-modi en authenticatiedetails.

  </Accordion>

  <Accordion title="Waarom zijn er twee exec-goedkeuringsconfigs voor chatgoedkeuringen?">
    Ze regelen verschillende lagen:

    - `approvals.exec`: stuurt goedkeuringsprompts door naar chatbestemmingen
    - `channels.<channel>.execApprovals`: laat dat kanaal fungeren als native goedkeuringsclient voor exec-goedkeuringen

    Het host-exec-beleid blijft de echte goedkeuringspoort. Chatconfiguratie bepaalt alleen waar goedkeuringsprompts
    verschijnen en hoe mensen erop kunnen antwoorden.

    In de meeste setups heb je **niet** allebei nodig:

    - Als de chat al opdrachten en antwoorden ondersteunt, werkt `/approve` in dezelfde chat via het gedeelde pad.
    - Als een ondersteund native kanaal goedkeurders veilig kan afleiden, schakelt OpenClaw nu automatisch DM-first native goedkeuringen in wanneer `channels.<channel>.execApprovals.enabled` niet is ingesteld of `"auto"` is.
    - Wanneer native goedkeuringskaarten/-knoppen beschikbaar zijn, is die native UI het primaire pad; de agent moet alleen een handmatige `/approve`-opdracht opnemen als het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring het enige pad is.
    - Gebruik `approvals.exec` alleen wanneer prompts ook moeten worden doorgestuurd naar andere chats of expliciete ops-ruimtes.
    - Gebruik `channels.<channel>.execApprovals.target: "channel"` of `"both"` alleen wanneer je expliciet wilt dat goedkeuringsprompts terug worden geplaatst in de oorspronkelijke ruimte/topic.
    - Plugin-goedkeuringen staan weer apart: ze gebruiken standaard `/approve` in dezelfde chat, optioneel doorsturen via `approvals.plugin`, en slechts sommige native kanalen houden daarbovenop native afhandeling van Plugin-goedkeuringen aan.

    Korte versie: doorsturen is voor routering, native clientconfiguratie is voor rijkere kanaalspecifieke UX.
    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welke runtime heb ik nodig?">
    Node **>= 22** is vereist. `pnpm` wordt aanbevolen. Bun wordt **niet aanbevolen** voor de Gateway.
  </Accordion>

  <Accordion title="Draait het op Raspberry Pi?">
    Ja. De Gateway is lichtgewicht - de docs noemen **512MB-1GB RAM**, **1 core** en ongeveer **500MB**
    schijfruimte als voldoende voor persoonlijk gebruik, en vermelden dat een **Raspberry Pi 4 dit kan draaien**.

    Als je extra marge wilt (logs, media, andere services), wordt **2GB aanbevolen**, maar dat is
    geen harde minimumvereiste.

    Tip: een kleine Pi/VPS kan de Gateway hosten, en je kunt **nodes** op je laptop/telefoon koppelen voor
    lokaal scherm/camera/canvas of opdrachtuitvoering. Zie [Nodes](/nl/nodes).

  </Accordion>

  <Accordion title="Tips voor Raspberry Pi-installaties?">
    Korte versie: het werkt, maar verwacht ruwe randjes.

    - Gebruik een **64-bit** OS en houd Node >= 22.
    - Geef de voorkeur aan de **hackbare (git-)installatie**, zodat je logs kunt bekijken en snel kunt bijwerken.
    - Begin zonder kanalen/Skills en voeg ze daarna een voor een toe.
    - Als je vreemde binaire problemen tegenkomt, is het meestal een **ARM-compatibiliteitsprobleem**.

    Docs: [Linux](/nl/platforms/linux), [Installeren](/nl/install).

  </Accordion>

  <Accordion title="Het blijft hangen op wake up my friend / onboarding wil niet hatchen. Wat nu?">
    Dat scherm hangt ervan af dat de Gateway bereikbaar en geauthenticeerd is. De TUI stuurt ook
    automatisch "Wake up, my friend!" bij de eerste hatch. Als je die regel ziet met **geen antwoord**
    en tokens op 0 blijven, heeft de agent nooit gedraaid.

    1. Herstart de Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Controleer status en authenticatie:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Als het nog steeds hangt, voer uit:

    ```bash
    openclaw doctor
    ```

    Als de Gateway remote is, zorg dan dat de tunnel-/Tailscale-verbinding actief is en dat de UI
    naar de juiste Gateway wijst. Zie [Remote access](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Kan ik mijn setup migreren naar een nieuwe machine (Mac mini) zonder onboarding opnieuw te doen?">
    Ja. Kopieer de **statusdirectory** en **workspace**, en voer daarna Doctor één keer uit. Dit
    houdt je bot "exactly the same" (geheugen, sessiegeschiedenis, authenticatie en kanaalstatus)
    zolang je **beide** locaties kopieert:

    1. Installeer OpenClaw op de nieuwe machine.
    2. Kopieer `$OPENCLAW_STATE_DIR` (standaard: `~/.openclaw`) vanaf de oude machine.
    3. Kopieer je workspace (standaard: `~/.openclaw/workspace`).
    4. Voer `openclaw doctor` uit en herstart de Gateway-service.

    Daarmee blijven configuratie, authenticatieprofielen, WhatsApp-credentials, sessies en geheugen behouden. Als je in
    remote-modus werkt, onthoud dan dat de gateway-host eigenaar is van de sessiestore en workspace.

    **Belangrijk:** als je alleen je workspace commit/pusht naar GitHub, maak je een back-up
    van **geheugen + bootstrapbestanden**, maar **niet** van sessiegeschiedenis of authenticatie. Die staan
    onder `~/.openclaw/` (bijvoorbeeld `~/.openclaw/agents/<agentId>/sessions/`).

    Gerelateerd: [Migreren](/nl/install/migrating), [Waar dingen op schijf staan](/nl/help/faq#where-things-live-on-disk),
    [Agent-workspace](/nl/concepts/agent-workspace), [Doctor](/nl/gateway/doctor),
    [Remote-modus](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Waar zie ik wat er nieuw is in de nieuwste versie?">
    Bekijk de GitHub-changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    De nieuwste vermeldingen staan bovenaan. Als de bovenste sectie is gemarkeerd als **Unreleased**, is de volgende gedateerde
    sectie de nieuwste uitgebrachte versie. Vermeldingen zijn gegroepeerd op **Highlights**, **Changes** en
    **Fixes** (plus docs/andere secties wanneer nodig).

  </Accordion>

  <Accordion title="Kan docs.openclaw.ai niet openen (SSL-fout)">
    Sommige Comcast-/Xfinity-verbindingen blokkeren `docs.openclaw.ai` onterecht via Xfinity
    Advanced Security. Schakel dit uit of zet `docs.openclaw.ai` op de allowlist en probeer het opnieuw.
    Help ons dit te deblokkeren door het hier te melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Als je de site nog steeds niet kunt bereiken, worden de docs gespiegeld op GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Verschil tussen stabiel en bèta">
    **Stabiel** en **bèta** zijn **npm dist-tags**, geen afzonderlijke codelijnen:

    - `latest` = stabiel
    - `beta` = vroege build voor testen

    Meestal komt een stabiele release eerst op **bèta** terecht, waarna een expliciete
    promotiestap diezelfde versie naar `latest` verplaatst. Maintainers kunnen ook
    direct naar `latest` publiceren wanneer dat nodig is. Daarom kunnen bèta en stabiel
    na promotie naar **dezelfde versie** verwijzen.

    Bekijk wat er is gewijzigd:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Voor install-one-liners en het verschil tussen bèta en dev, zie de accordeon hieronder.

  </Accordion>

  <Accordion title="Hoe installeer ik de bètaversie en wat is het verschil tussen bèta en dev?">
    **Bèta** is de npm dist-tag `beta` (kan na promotie overeenkomen met `latest`).
    **Dev** is de bewegende head van `main` (git); wanneer gepubliceerd, gebruikt die de npm dist-tag `dev`.

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-installatieprogramma (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Meer details: [Ontwikkelingskanalen](/nl/install/development-channels) en [Installer-flags](/nl/install/installer).

  </Accordion>

  <Accordion title="Hoe probeer ik de nieuwste bits?">
    Twee opties:

    1. **Dev-kanaal (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dit schakelt over naar de `main`-branch en werkt bij vanuit de broncode.

    2. **Aanpasbare installatie (vanaf de installersite):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dat geeft je een lokale repo die je kunt bewerken en daarna via git kunt bijwerken.

    Als je liever handmatig een schone clone maakt, gebruik dan:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Bijwerken](/nl/cli/update), [Ontwikkelingskanalen](/nl/install/development-channels),
    [Installeren](/nl/install).

  </Accordion>

  <Accordion title="Hoe lang duren installatie en onboarding meestal?">
    Grove richtlijn:

    - **Installatie:** 2-5 minuten
    - **Onboarding:** 5-15 minuten, afhankelijk van hoeveel kanalen/modellen je configureert

    Als het blijft hangen, gebruik dan [Installer vastgelopen](#quick-start-and-first-run-setup)
    en de snelle debug-loop in [Ik zit vast](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer vastgelopen? Hoe krijg ik meer feedback?">
    Voer de installer opnieuw uit met **uitgebreide uitvoer**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Bèta-installatie met uitgebreide uitvoer:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Voor een aanpasbare (git-)installatie:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows-equivalent (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Meer opties: [Installer-flags](/nl/install/installer).

  </Accordion>

  <Accordion title="Windows-installatie zegt dat git niet is gevonden of dat openclaw niet wordt herkend">
    Twee veelvoorkomende Windows-problemen:

    **1) npm-fout spawn git / git niet gevonden**

    - Installeer **Git for Windows** en zorg dat `git` op je PATH staat.
    - Sluit PowerShell en open het opnieuw, en voer daarna de installer opnieuw uit.

    **2) openclaw wordt na installatie niet herkend**

    - Je globale npm-binmap staat niet op PATH.
    - Controleer het pad:

      ```powershell
      npm config get prefix
      ```

    - Voeg die map toe aan je gebruikers-PATH (geen `\bin`-suffix nodig op Windows; op de meeste systemen is dit `%AppData%\npm`).
    - Sluit PowerShell en open het opnieuw nadat je PATH hebt bijgewerkt.

    Als je de soepelste Windows-installatie wilt, gebruik dan **WSL2** in plaats van native Windows.
    Docs: [Windows](/nl/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec-uitvoer toont vervormde Chinese tekst - wat moet ik doen?">
    Dit is meestal een mismatch in de console-codepagina op native Windows-shells.

    Symptomen:

    - `system.run`/`exec`-uitvoer geeft Chinees weer als mojibake
    - Dezelfde opdracht ziet er goed uit in een ander terminalprofiel

    Snelle tijdelijke oplossing in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Start daarna de Gateway opnieuw en probeer je opdracht opnieuw:

    ```powershell
    openclaw gateway restart
    ```

    Als je dit nog steeds kunt reproduceren op de nieuwste OpenClaw, volg/rapporteer het in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="De docs beantwoordden mijn vraag niet - hoe krijg ik een beter antwoord?">
    Gebruik de **hackbare (git)-installatie** zodat je de volledige broncode en docs lokaal hebt, en vraag het daarna
    je bot (of Claude/Codex) _vanuit die map_ zodat deze de repo kan lezen en precies kan antwoorden.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Meer details: [Installeren](/nl/install) en [Installer-vlaggen](/nl/install/installer).

  </Accordion>

  <Accordion title="Hoe installeer ik OpenClaw op Linux?">
    Kort antwoord: volg de Linux-handleiding en voer daarna onboarding uit.

    - Snel pad voor Linux + service-installatie: [Linux](/nl/platforms/linux).
    - Volledige walkthrough: [Aan de slag](/nl/start/getting-started).
    - Installer + updates: [Installatie en updates](/nl/install/updating).

  </Accordion>

  <Accordion title="Hoe installeer ik OpenClaw op een VPS?">
    Elke Linux-VPS werkt. Installeer op de server en gebruik daarna SSH/Tailscale om de Gateway te bereiken.

    Handleidingen: [exe.dev](/nl/install/exe-dev), [Hetzner](/nl/install/hetzner), [Fly.io](/nl/install/fly).
    Externe toegang: [Gateway op afstand](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Waar zijn de installatiehandleidingen voor cloud/VPS?">
    We onderhouden een **hostinghub** met de gangbare providers. Kies er een en volg de handleiding:

    - [VPS-hosting](/nl/vps) (alle providers op één plek)
    - [Fly.io](/nl/install/fly)
    - [Hetzner](/nl/install/hetzner)
    - [exe.dev](/nl/install/exe-dev)

    Zo werkt het in de cloud: de **Gateway draait op de server**, en je opent deze
    vanaf je laptop/telefoon via de Control UI (of Tailscale/SSH). Je status + workspace
    staan op de server, dus behandel de host als de bron van waarheid en maak er back-ups van.

    Je kunt **nodes** (Mac/iOS/Android/headless) koppelen aan die cloud-Gateway om toegang te krijgen tot
    lokaal scherm/camera/canvas of opdrachten op je laptop uit te voeren terwijl je de
    Gateway in de cloud houdt.

    Hub: [Platforms](/nl/platforms). Externe toegang: [Gateway op afstand](/nl/gateway/remote).
    Nodes: [Nodes](/nl/nodes), [Nodes CLI](/nl/cli/nodes).

  </Accordion>

  <Accordion title="Kan ik OpenClaw vragen zichzelf bij te werken?">
    Kort antwoord: **mogelijk, niet aanbevolen**. De updateflow kan de
    Gateway opnieuw starten (waardoor de actieve sessie wegvalt), kan een schone git-checkout vereisen en
    kan om bevestiging vragen. Veiliger: voer updates uit vanuit een shell als operator.

    Gebruik de CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Als je moet automatiseren vanuit een agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Bijwerken](/nl/cli/update), [Updaten](/nl/install/updating).

  </Accordion>

  <Accordion title="Wat doet onboarding eigenlijk?">
    `openclaw onboard` is het aanbevolen installatiepad. In **lokale modus** leidt het je door:

    - **Model-/auth-installatie** (provider-OAuth, API-sleutels, Anthropic setup-token, plus lokale modelopties zoals LM Studio)
    - **Workspace**-locatie + bootstrapbestanden
    - **Gateway-instellingen** (bind/port/auth/tailscale)
    - **Kanalen** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus gebundelde kanaalplugins zoals QQ Bot)
    - **Daemon-installatie** (LaunchAgent op macOS; systemd-gebruikerseenheid op Linux/WSL2)
    - **Gezondheidscontroles** en selectie van **skills**

    Het waarschuwt ook als je geconfigureerde model onbekend is of auth ontbreekt.

  </Accordion>

  <Accordion title="Heb ik een Claude- of OpenAI-abonnement nodig om dit te draaien?">
    Nee. Je kunt OpenClaw draaien met **API-sleutels** (Anthropic/OpenAI/anderen) of met
    **alleen-lokale modellen** zodat je gegevens op je apparaat blijven. Abonnementen (Claude
    Pro/Max of OpenAI Codex) zijn optionele manieren om bij die providers te authenticeren.

    Voor Anthropic in OpenClaw is de praktische verdeling:

    - **Anthropic API-sleutel**: normale Anthropic API-facturering
    - **Claude CLI / Claude-abonnementsauth in OpenClaw**: Anthropic-medewerkers
      hebben ons verteld dat dit gebruik weer is toegestaan, en OpenClaw behandelt `claude -p`-gebruik
      als toegestaan voor deze integratie tenzij Anthropic een nieuw
      beleid publiceert

    Voor langlopende gatewayhosts blijven Anthropic API-sleutels de meer
    voorspelbare installatie. OpenAI Codex OAuth wordt expliciet ondersteund voor externe
    tools zoals OpenClaw.

    OpenClaw ondersteunt ook andere gehoste abonnementsachtige opties, waaronder
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** en
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/nl/providers/anthropic), [OpenAI](/nl/providers/openai),
    [Qwen Cloud](/nl/providers/qwen),
    [MiniMax](/nl/providers/minimax), [GLM Models](/nl/providers/glm),
    [Lokale modellen](/nl/gateway/local-models), [Modellen](/nl/concepts/models).

  </Accordion>

  <Accordion title="Kan ik een Claude Max-abonnement gebruiken zonder API-sleutel?">
    Ja.

    Anthropic-medewerkers hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl weer is toegestaan, dus
    OpenClaw behandelt Claude-abonnementsauth en `claude -p`-gebruik als toegestaan
    voor deze integratie tenzij Anthropic een nieuw beleid publiceert. Als je
    de meest voorspelbare server-side installatie wilt, gebruik dan in plaats daarvan een Anthropic API-sleutel.

  </Accordion>

  <Accordion title="Ondersteunen jullie Claude-abonnementsauth (Claude Pro of Max)?">
    Ja.

    Anthropic-medewerkers hebben ons verteld dat dit gebruik weer is toegestaan, dus OpenClaw behandelt
    hergebruik van Claude CLI en `claude -p`-gebruik als toegestaan voor deze integratie
    tenzij Anthropic een nieuw beleid publiceert.

    Anthropic setup-token is nog steeds beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.
    Voor productie- of multi-user workloads blijft auth met een Anthropic API-sleutel de
    veiligere, voorspelbaardere keuze. Als je andere abonnementsachtige gehoste
    opties in OpenClaw wilt, zie [OpenAI](/nl/providers/openai), [Qwen / Model
    Cloud](/nl/providers/qwen), [MiniMax](/nl/providers/minimax) en [GLM
    Models](/nl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Waarom zie ik HTTP 429 rate_limit_error van Anthropic?">
    Dat betekent dat je **Anthropic-quotum/rate limit** is opgebruikt voor het huidige venster. Als je
    **Claude CLI** gebruikt, wacht dan tot het venster wordt gereset of upgrade je plan. Als je
    een **Anthropic API-sleutel** gebruikt, controleer dan de Anthropic Console
    op gebruik/facturering en verhoog limieten indien nodig.

    Als het bericht specifiek is:
    `Extra usage is required for long context requests`, probeert het verzoek
    Anthropic's 1M-contextbèta (`context1m: true`) te gebruiken. Dat werkt alleen wanneer je
    referentie in aanmerking komt voor long-context-facturering (facturering via API-sleutel of het
    OpenClaw Claude-loginpad met Extra Usage ingeschakeld).

    Tip: stel een **fallbackmodel** in zodat OpenClaw kan blijven antwoorden wanneer een provider rate-limited is.
    Zie [Modellen](/nl/cli/models), [OAuth](/nl/concepts/oauth) en
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/nl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wordt AWS Bedrock ondersteund?">
    Ja. OpenClaw heeft een gebundelde **Amazon Bedrock (Converse)**-provider. Wanneer AWS-env-markeringen aanwezig zijn, kan OpenClaw de Bedrock-catalogus voor streaming/tekst automatisch ontdekken en samenvoegen als een impliciete `amazon-bedrock`-provider; anders kun je expliciet `plugins.entries.amazon-bedrock.config.discovery.enabled` inschakelen of een handmatige providervermelding toevoegen. Zie [Amazon Bedrock](/nl/providers/bedrock) en [Modelproviders](/nl/providers/models). Als je liever een beheerde sleutelstroom gebruikt, is een OpenAI-compatibele proxy vóór Bedrock nog steeds een geldige optie.
  </Accordion>

  <Accordion title="Hoe werkt Codex-authenticatie?">
    OpenClaw ondersteunt **OpenAI Code (Codex)** via OAuth (ChatGPT-inloggen). Gebruik
    `openai/gpt-5.5` met `agentRuntime.id: "codex"` voor de gebruikelijke configuratie:
    ChatGPT/Codex-abonnementsauthenticatie plus uitvoering via de native Codex-appserver. Gebruik
    `openai-codex/gpt-5.5` alleen wanneer je Codex OAuth via de standaard
    Codex-runtime wilt. Directe toegang met een OpenAI API-sleutel blijft beschikbaar voor niet-agentgebonden
    OpenAI API-oppervlakken en voor agentmodellen via een geordend
    `openai-codex` API-sleutelprofiel.
    Zie [Modelproviders](/nl/concepts/model-providers) en [Onboarding (CLI)](/nl/start/wizard).
  </Accordion>

  <Accordion title="Waarom vermeldt OpenClaw nog steeds openai-codex?">
    `openai-codex` is de provider- en auth-profiel-id voor ChatGPT/Codex OAuth.
    Oudere configuraties gebruikten dit ook als modelprefix:

    - `openai/gpt-5.5` = ChatGPT/Codex-abonnementsauthenticatie met native Codex-runtime voor agentbeurten
    - `openai-codex/gpt-5.5` = verouderde modelroute die wordt gerepareerd door `openclaw doctor --fix`
    - `openai/gpt-5.5` plus een geordend `openai-codex` API-sleutelprofiel = API-sleutelauthenticatie voor een OpenAI-agentmodel
    - `openai-codex:...` = auth-profiel-id, geen modelverwijzing

    Als je het pad voor directe OpenAI Platform-facturering/limieten wilt, stel dan
    `OPENAI_API_KEY` in. Als je ChatGPT/Codex-abonnementsauthenticatie wilt, meld je dan aan met
    `openclaw models auth login --provider openai-codex`. Houd de modelverwijzing op
    `openai/gpt-5.5`; `openai-codex/*`-modelverwijzingen zijn verouderde configuratie die
    `openclaw doctor --fix` herschrijft.

  </Accordion>

  <Accordion title="Waarom kunnen Codex OAuth-limieten verschillen van ChatGPT web?">
    Codex OAuth gebruikt door OpenAI beheerde, planafhankelijke quotavensters. In de praktijk
    kunnen die limieten verschillen van de ChatGPT-website/app-ervaring, zelfs wanneer
    beide aan hetzelfde account zijn gekoppeld.

    OpenClaw kan de momenteel zichtbare providergebruiks-/quotavensters tonen in
    `openclaw models status`, maar het verzint of normaliseert ChatGPT-web
    rechten niet naar directe API-toegang. Als je het pad voor directe OpenAI Platform-
    facturering/limieten wilt, gebruik dan `openai/*` met een API-sleutel.

  </Accordion>

  <Accordion title="Ondersteunen jullie OpenAI-abonnementsauthenticatie (Codex OAuth)?">
    Ja. OpenClaw ondersteunt **OpenAI Code (Codex)-abonnements-OAuth** volledig.
    OpenAI staat expliciet abonnements-OAuth-gebruik toe in externe tools/workflows
    zoals OpenClaw. Onboarding kan de OAuth-stroom voor je uitvoeren.

    Zie [OAuth](/nl/concepts/oauth), [Modelproviders](/nl/concepts/model-providers) en [Onboarding (CLI)](/nl/start/wizard).

  </Accordion>

  <Accordion title="Hoe stel ik Gemini CLI OAuth in?">
    Gemini CLI gebruikt een **plugin-authenticatiestroom**, geen client-id of secret in `openclaw.json`.

    Stappen:

    1. Installeer Gemini CLI lokaal zodat `gemini` op `PATH` staat
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Schakel de plugin in: `openclaw plugins enable google`
    3. Log in: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standaardmodel na inloggen: `google-gemini-cli/gemini-3-flash-preview`
    5. Als verzoeken mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of `GOOGLE_CLOUD_PROJECT_ID` in op de gatewayhost

    Dit slaat OAuth-tokens op in auth-profielen op de gatewayhost. Details: [Modelproviders](/nl/concepts/model-providers).

  </Accordion>

  <Accordion title="Is een lokaal model geschikt voor informele chats?">
    Meestal niet. OpenClaw heeft een grote context en sterke veiligheid nodig; kleine kaarten kappen af en lekken. Als het echt moet, draai dan lokaal de **grootste** modelbuild die je kunt (LM Studio) en zie [/gateway/local-models](/nl/gateway/local-models). Kleinere/gequantiseerde modellen verhogen het risico op promptinjectie - zie [Beveiliging](/nl/gateway/security).
  </Accordion>

  <Accordion title="Hoe houd ik gehost modelverkeer in een specifieke regio?">
    Kies regiogebonden endpoints. OpenRouter biedt in de VS gehoste opties voor MiniMax, Kimi en GLM; kies de in de VS gehoste variant om data in de regio te houden. Je kunt Anthropic/OpenAI nog steeds naast deze aanbieders tonen door `models.mode: "merge"` te gebruiken, zodat fallbacks beschikbaar blijven terwijl je de gekozen regiogebonden provider respecteert.
  </Accordion>

  <Accordion title="Moet ik een Mac Mini kopen om dit te installeren?">
    Nee. OpenClaw draait op macOS of Linux (Windows via WSL2). Een Mac mini is optioneel - sommige mensen
    kopen er een als always-on host, maar een kleine VPS, thuisserver of Raspberry Pi-klasse apparaat werkt ook.

    Je hebt alleen een Mac nodig **voor tools die alleen op macOS werken**. Gebruik voor iMessage [BlueBubbles](/nl/channels/bluebubbles) (aanbevolen) - de BlueBubbles-server draait op elke Mac, en de Gateway kan op Linux of elders draaien. Als je andere macOS-only tools wilt, draai de Gateway dan op een Mac of koppel een macOS-node.

    Docs: [BlueBubbles](/nl/channels/bluebubbles), [Nodes](/nl/nodes), [Mac remote mode](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Heb ik een Mac mini nodig voor iMessage-ondersteuning?">
    Je hebt **een macOS-apparaat** nodig dat is ingelogd bij Berichten. Dat hoeft **geen** Mac mini te zijn -
    elke Mac werkt. **Gebruik [BlueBubbles](/nl/channels/bluebubbles)** (aanbevolen) voor iMessage - de BlueBubbles-server draait op macOS, terwijl de Gateway op Linux of elders kan draaien.

    Gebruikelijke configuraties:

    - Draai de Gateway op Linux/VPS en draai de BlueBubbles-server op een Mac die is ingelogd bij Berichten.
    - Draai alles op de Mac als je de eenvoudigste setup op één machine wilt.

    Docs: [BlueBubbles](/nl/channels/bluebubbles), [Nodes](/nl/nodes),
    [Mac remote mode](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Als ik een Mac mini koop om OpenClaw te draaien, kan ik die dan verbinden met mijn MacBook Pro?">
    Ja. De **Mac mini kan de Gateway draaien**, en je MacBook Pro kan verbinden als
    **node** (begeleidend apparaat). Nodes draaien de Gateway niet - ze leveren extra
    mogelijkheden zoals scherm/camera/canvas en `system.run` op dat apparaat.

    Gebruikelijk patroon:

    - Gateway op de Mac mini (always-on).
    - MacBook Pro draait de macOS-app of een nodehost en koppelt met de Gateway.
    - Gebruik `openclaw nodes status` / `openclaw nodes list` om deze te bekijken.

    Docs: [Nodes](/nl/nodes), [Nodes CLI](/nl/cli/nodes).

  </Accordion>

  <Accordion title="Kan ik Bun gebruiken?">
    Bun wordt **niet aanbevolen**. We zien runtimebugs, vooral met WhatsApp en Telegram.
    Gebruik **Node** voor stabiele gateways.

    Als je toch met Bun wilt experimenteren, doe dat dan op een niet-productie-Gateway
    zonder WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: wat komt er in allowFrom?">
    `channels.telegram.allowFrom` is **de Telegram-gebruikers-ID van de menselijke afzender** (numeriek). Het is niet de botgebruikersnaam.

    De setup vraagt alleen om numerieke gebruikers-ID's. Als je al verouderde `@username`-vermeldingen in de configuratie hebt, kan `openclaw doctor --fix` proberen ze op te lossen.

    Veiliger (geen bot van derden):

    - Stuur je bot een DM, voer daarna `openclaw logs --follow` uit en lees `from.id`.

    Officiële Bot API:

    - Stuur je bot een DM, roep daarna `https://api.telegram.org/bot<bot_token>/getUpdates` aan en lees `message.from.id`.

    Derden (minder privé):

    - Stuur `@userinfobot` of `@getidsbot` een DM.

    Zie [/channels/telegram](/nl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Kunnen meerdere mensen één WhatsApp-nummer gebruiken met verschillende OpenClaw-instanties?">
    Ja, via **multi-agent routing**. Bind de WhatsApp-**DM** van elke afzender (peer `kind: "direct"`, afzender E.164 zoals `+15551234567`) aan een andere `agentId`, zodat elke persoon zijn eigen workspace en sessieopslag krijgt. Antwoorden komen nog steeds van hetzelfde **WhatsApp-account**, en DM-toegangscontrole (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) is globaal per WhatsApp-account. Zie [Multi-Agent Routing](/nl/concepts/multi-agent) en [WhatsApp](/nl/channels/whatsapp).
  </Accordion>

  <Accordion title='Kan ik een "fast chat"-agent en een "Opus voor coderen"-agent draaien?'>
    Ja. Gebruik multi-agent routing: geef elke agent zijn eigen standaardmodel en bind vervolgens inkomende routes (provideraccount of specifieke peers) aan elke agent. Voorbeeldconfiguratie staat in [Multi-Agent Routing](/nl/concepts/multi-agent). Zie ook [Modellen](/nl/concepts/models) en [Configuratie](/nl/gateway/configuration).
  </Accordion>

  <Accordion title="Werkt Homebrew op Linux?">
    Ja. Homebrew ondersteunt Linux (Linuxbrew). Snelle setup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Als je OpenClaw via systemd draait, zorg er dan voor dat de service-PATH `/home/linuxbrew/.linuxbrew/bin` (of je brew-prefix) bevat, zodat met `brew` geïnstalleerde tools in niet-login shells worden gevonden.
    Recente builds voegen ook veelgebruikte gebruikers-bin-mappen vooraan toe in Linux systemd-services (bijvoorbeeld `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) en respecteren `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` en `FNM_DIR` wanneer ze zijn ingesteld.

  </Accordion>

  <Accordion title="Verschil tussen de hackbare git-installatie en npm-installatie">
    - **Hackbare (git)-installatie:** volledige source-checkout, bewerkbaar, het beste voor contributors.
      Je draait builds lokaal en kunt code/docs patchen.
    - **npm-installatie:** globale CLI-installatie, geen repo, het beste voor "gewoon draaien".
      Updates komen van npm dist-tags.

    Docs: [Aan de slag](/nl/start/getting-started), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Kan ik later wisselen tussen npm- en git-installaties?">
    Ja. Gebruik `openclaw update --channel ...` wanneer OpenClaw al is geïnstalleerd.
    Dit **verwijdert je data niet** - het wijzigt alleen de OpenClaw-code-installatie.
    Je staat (`~/.openclaw`) en workspace (`~/.openclaw/workspace`) blijven onaangeroerd.

    Van npm naar git:

    ```bash
    openclaw update --channel dev
    ```

    Van git naar npm:

    ```bash
    openclaw update --channel stable
    ```

    Voeg `--dry-run` toe om eerst de geplande moduswissel te bekijken. De updater voert
    Doctor-follow-ups uit, ververst pluginsources voor het doelkanaal en
    herstart de Gateway tenzij je `--no-restart` meegeeft.

    De installer kan beide modi ook afdwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Back-uptips: zie [Back-upstrategie](/nl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Moet ik de Gateway op mijn laptop of op een VPS draaien?">
    Kort antwoord: **als je 24/7-betrouwbaarheid wilt, gebruik dan een VPS**. Als je de
    minste wrijving wilt en slaapstand/herstarts oké vindt, draai hem dan lokaal.

    **Laptop (lokale Gateway)**

    - **Voordelen:** geen serverkosten, directe toegang tot lokale bestanden, live browservenster.
    - **Nadelen:** slaapstand/netwerkuitval = verbroken verbindingen, OS-updates/herstarts onderbreken, moet wakker blijven.

    **VPS / cloud**

    - **Voordelen:** altijd aan, stabiel netwerk, geen problemen met slaapstand van laptop, gemakkelijker draaiend te houden.
    - **Nadelen:** draait vaak headless (gebruik screenshots), alleen externe bestandstoegang, je moet SSH gebruiken voor updates.

    **OpenClaw-specifieke opmerking:** WhatsApp/Telegram/Slack/Mattermost/Discord werken allemaal prima vanaf een VPS. De enige echte afweging is **headless browser** versus een zichtbaar venster. Zie [Browser](/nl/tools/browser).

    **Aanbevolen standaard:** VPS als je eerder verbroken gatewayverbindingen had. Lokaal is uitstekend wanneer je de Mac actief gebruikt en lokale bestandstoegang of UI-automatisering met een zichtbare browser wilt.

  </Accordion>

  <Accordion title="How important is it to run OpenClaw on a dedicated machine?">
    Niet vereist, maar **aanbevolen voor betrouwbaarheid en isolatie**.

    - **Toegewijde host (VPS/Mac mini/Pi):** altijd aan, minder onderbrekingen door slaapstand/herstarts, schonere machtigingen, gemakkelijker draaiend te houden.
    - **Gedeelde laptop/desktop:** helemaal prima voor testen en actief gebruik, maar verwacht pauzes wanneer de machine in slaapstand gaat of updates uitvoert.

    Als je het beste van beide werelden wilt, houd de Gateway dan op een toegewijde host en koppel je laptop als een **Node** voor lokale scherm-/camera-/exec-tools. Zie [Nodes](/nl/nodes).
    Lees [Security](/nl/gateway/security) voor beveiligingsrichtlijnen.

  </Accordion>

  <Accordion title="What are the minimum VPS requirements and recommended OS?">
    OpenClaw is lichtgewicht. Voor een basis-Gateway + één chatkanaal:

    - **Absoluut minimum:** 1 vCPU, 1 GB RAM, ~500 MB schijfruimte.
    - **Aanbevolen:** 1-2 vCPU, 2 GB RAM of meer voor extra ruimte (logs, media, meerdere kanalen). Node-tools en browserautomatisering kunnen veel resources gebruiken.

    OS: gebruik **Ubuntu LTS** (of een moderne Debian/Ubuntu). Het Linux-installatiepad is daar het best getest.

    Docs: [Linux](/nl/platforms/linux), [VPS-hosting](/nl/vps).

  </Accordion>

  <Accordion title="Can I run OpenClaw in a VM and what are the requirements?">
    Ja. Behandel een VM hetzelfde als een VPS: deze moet altijd aan staan, bereikbaar zijn en genoeg
    RAM hebben voor de Gateway en alle kanalen die je inschakelt.

    Basisrichtlijnen:

    - **Absoluut minimum:** 1 vCPU, 1 GB RAM.
    - **Aanbevolen:** 2 GB RAM of meer als je meerdere kanalen, browserautomatisering of mediatools draait.
    - **OS:** Ubuntu LTS of een andere moderne Debian/Ubuntu.

    Als je Windows gebruikt, is **WSL2 de gemakkelijkste VM-achtige setup** en heeft het de beste tooling-
    compatibiliteit. Zie [Windows](/nl/platforms/windows), [VPS-hosting](/nl/vps).
    Als je macOS in een VM draait, zie [macOS VM](/nl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [FAQ](/nl/help/faq) — de hoofd-FAQ (modellen, sessies, Gateway, beveiliging, meer)
- [Installatieoverzicht](/nl/install)
- [Aan de slag](/nl/start/getting-started)
- [Probleemoplossing](/nl/help/troubleshooting)
