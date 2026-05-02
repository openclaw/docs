---
read_when:
    - Nieuwe installatie, vastgelopen eerste configuratie of fouten bij de eerste start
    - Authenticatie- en providerabonnementen kiezen
    - Geen toegang tot docs.openclaw.ai, kan dashboard niet openen, installatie loopt vast
sidebarTitle: First-run FAQ
summary: 'FAQ: quickstart en configuratie bij eerste start — installeren, onboarding, authenticatie, abonnementen, initiële fouten'
title: 'Veelgestelde vragen: configuratie bij eerste gebruik'
x-i18n:
    generated_at: "2026-05-02T11:18:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  Snelstart en vragen en antwoorden voor de eerste keer uitvoeren. Voor dagelijkse bewerkingen, modellen, auth, sessies
  en probleemoplossing zie de hoofd-[FAQ](/nl/help/faq).

  ## Snelstart en eerste configuratie

  <AccordionGroup>
  <Accordion title="Ik zit vast, snelste manier om verder te komen">
    Gebruik een lokale AI-agent die **je machine kan zien**. Dat is veel effectiever dan vragen
    in Discord, omdat de meeste gevallen van "ik zit vast" **lokale configuratie- of omgevingsproblemen** zijn die
    hulp op afstand niet kan inspecteren.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Deze tools kunnen de repo lezen, opdrachten uitvoeren, logs inspecteren en helpen je setup op machineniveau
    te repareren (PATH, services, rechten, auth-bestanden). Geef ze de **volledige broncodecheckout** via
    de hackbare (git) installatie:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dit installeert OpenClaw **vanuit een git checkout**, zodat de agent de code + docs kan lezen en
    kan redeneren over de exacte versie die je draait. Je kunt later altijd terugschakelen naar stabiel
    door de installer opnieuw uit te voeren zonder `--install-method git`.

    Tip: vraag de agent de oplossing **te plannen en te begeleiden** (stap voor stap), en voer daarna alleen de
    noodzakelijke opdrachten uit. Zo blijven wijzigingen klein en eenvoudiger te controleren.

    Als je een echte bug of fix ontdekt, maak dan een GitHub issue aan of stuur een PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Begin met deze opdrachten (deel uitvoer wanneer je om hulp vraagt):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Wat ze doen:

    - `openclaw status`: snelle momentopname van gateway-/agentgezondheid + basisconfiguratie.
    - `openclaw models status`: controleert provider-auth + beschikbaarheid van modellen.
    - `openclaw doctor`: valideert en repareert veelvoorkomende configuratie-/statusproblemen.

    Andere nuttige CLI-controles: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Snelle debugloop: [Eerste 60 seconden als iets stuk is](#first-60-seconds-if-something-is-broken).
    Installatiedocs: [Installeren](/nl/install), [Installer-flags](/nl/install/installer), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat blijft overslaan. Wat betekenen de oversla-redenen?">
    Veelvoorkomende Heartbeat-oversla-redenen:

    - `quiet-hours`: buiten het geconfigureerde venster met actieve uren
    - `empty-heartbeat-file`: `HEARTBEAT.md` bestaat, maar bevat alleen lege of alleen header-scaffolding
    - `no-tasks-due`: `HEARTBEAT.md`-taakmodus is actief, maar nog geen van de taakintervallen is toe
    - `alerts-disabled`: alle Heartbeat-zichtbaarheid is uitgeschakeld (`showOk`, `showAlerts` en `useIndicator` staan allemaal uit)

    In taakmodus worden vervaltijdstempels pas bijgewerkt nadat een echte Heartbeat-run
    is voltooid. Overgeslagen runs markeren taken niet als voltooid.

    Docs: [Heartbeat](/nl/gateway/heartbeat), [Automatisering en taken](/nl/automation).

  </Accordion>

  <Accordion title="Aanbevolen manier om OpenClaw te installeren en in te stellen">
    De repo raadt aan om vanuit de broncode te draaien en onboarding te gebruiken:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    De wizard kan ook automatisch UI-assets bouwen. Na onboarding draai je de Gateway doorgaans op poort **18789**.

    Vanuit broncode (contributors/dev):

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
    De wizard opent direct na onboarding je browser met een schone (niet-getokeniseerde) dashboard-URL en print de link ook in de samenvatting. Houd dat tabblad open; als het niet is gestart, kopieer/plak dan de geprinte URL op dezelfde machine.
  </Accordion>

  <Accordion title="Hoe authenticeer ik het dashboard op localhost versus remote?">
    **Localhost (dezelfde machine):**

    - Open `http://127.0.0.1:18789/`.
    - Als er om shared-secret-auth wordt gevraagd, plak dan de geconfigureerde token of het wachtwoord in de instellingen van Control UI.
    - Tokenbron: `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
    - Wachtwoordbron: `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
    - Als er nog geen shared secret is geconfigureerd, genereer dan een token met `openclaw doctor --generate-gateway-token`.

    **Niet op localhost:**

    - **Tailscale Serve** (aanbevolen): houd bind op loopback, voer `openclaw gateway --tailscale serve` uit, open `https://<magicdns>/`. Als `gateway.auth.allowTailscale` `true` is, voldoen identity-headers aan Control UI-/WebSocket-auth (geen geplakt shared secret, gaat uit van vertrouwde gatewayhost); HTTP-API's vereisen nog steeds shared-secret-auth, tenzij je bewust private-ingress `none` of trusted-proxy HTTP-auth gebruikt.
      Slechte gelijktijdige Serve-auth-pogingen van dezelfde client worden geserialiseerd voordat de failed-auth limiter ze registreert, dus de tweede slechte retry kan al `retry later` tonen.
    - **Tailnet-bind**: voer `openclaw gateway --bind tailnet --token "<token>"` uit (of configureer wachtwoord-auth), open `http://<tailscale-ip>:18789/`, en plak daarna het overeenkomende shared secret in de dashboardinstellingen.
    - **Identiteitsbewuste reverse proxy**: houd de Gateway achter een vertrouwde proxy, configureer `gateway.auth.mode: "trusted-proxy"` en open daarna de proxy-URL. Same-host loopback-proxy's vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`. Shared-secret-auth blijft gelden over de tunnel; plak de geconfigureerde token of het wachtwoord als daarom wordt gevraagd.

    Zie [Dashboard](/nl/web/dashboard) en [Weboppervlakken](/nl/web) voor bind-modi en auth-details.

  </Accordion>

  <Accordion title="Waarom zijn er twee exec-goedkeuringsconfiguraties voor chatgoedkeuringen?">
    Ze beheren verschillende lagen:

    - `approvals.exec`: stuurt goedkeuringsprompts door naar chatbestemmingen
    - `channels.<channel>.execApprovals`: laat dat kanaal optreden als native goedkeuringsclient voor exec-goedkeuringen

    Het exec-beleid van de host is nog steeds de echte goedkeuringspoort. Chatconfiguratie bepaalt alleen waar goedkeuringsprompts
    verschijnen en hoe mensen erop kunnen antwoorden.

    In de meeste setups heb je **niet** beide nodig:

    - Als de chat al opdrachten en antwoorden ondersteunt, werkt same-chat `/approve` via het gedeelde pad.
    - Als een ondersteund native kanaal approvers veilig kan afleiden, schakelt OpenClaw nu automatisch DM-first native goedkeuringen in wanneer `channels.<channel>.execApprovals.enabled` niet is ingesteld of `"auto"` is.
    - Wanneer native goedkeuringskaarten/-knoppen beschikbaar zijn, is die native UI het primaire pad; de agent moet alleen een handmatige `/approve`-opdracht opnemen als het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring het enige pad is.
    - Gebruik `approvals.exec` alleen wanneer prompts ook moeten worden doorgestuurd naar andere chats of expliciete ops-ruimtes.
    - Gebruik `channels.<channel>.execApprovals.target: "channel"` of `"both"` alleen wanneer je expliciet wilt dat goedkeuringsprompts terug in de oorspronkelijke ruimte/topic worden geplaatst.
    - Plugin-goedkeuringen zijn weer apart: ze gebruiken standaard same-chat `/approve`, optionele `approvals.plugin`-doorsturing, en slechts sommige native kanalen houden daarbovenop plugin-approval-native-afhandeling actief.

    Korte versie: doorsturen is voor routering, native clientconfiguratie is voor rijkere kanaalspecifieke UX.
    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welke runtime heb ik nodig?">
    Node **>= 22** is vereist. `pnpm` wordt aanbevolen. Bun wordt **niet aanbevolen** voor de Gateway.
  </Accordion>

  <Accordion title="Draait het op Raspberry Pi?">
    Ja. De Gateway is lichtgewicht - de docs noemen **512MB-1GB RAM**, **1 core** en ongeveer **500MB**
    schijfruimte als voldoende voor persoonlijk gebruik, en melden dat een **Raspberry Pi 4 het kan draaien**.

    Als je extra ruimte wilt (logs, media, andere services), wordt **2GB aanbevolen**, maar dat is
    geen harde minimumvereiste.

    Tip: een kleine Pi/VPS kan de Gateway hosten, en je kunt **nodes** op je laptop/telefoon koppelen voor
    lokaal scherm/camera/canvas of opdrachtuitvoering. Zie [Nodes](/nl/nodes).

  </Accordion>

  <Accordion title="Tips voor Raspberry Pi-installaties?">
    Korte versie: het werkt, maar verwacht ruwe randjes.

    - Gebruik een **64-bit** OS en houd Node >= 22.
    - Geef de voorkeur aan de **hackbare (git) installatie**, zodat je logs kunt zien en snel kunt bijwerken.
    - Begin zonder kanalen/Skills, en voeg ze daarna één voor één toe.
    - Als je vreemde binaire problemen tegenkomt, is het meestal een **ARM-compatibiliteitsprobleem**.

    Docs: [Linux](/nl/platforms/linux), [Installeren](/nl/install).

  </Accordion>

  <Accordion title="Het blijft hangen op wake up my friend / onboarding wil niet uitkomen. Wat nu?">
    Dat scherm hangt af van de bereikbaarheid en authenticatie van de Gateway. De TUI stuurt ook
    automatisch "Wake up, my friend!" bij de eerste hatch. Als je die regel ziet met **geen antwoord**
    en tokens op 0 blijven, heeft de agent nooit gedraaid.

    1. Herstart de Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Controleer status + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Als het nog steeds hangt, voer uit:

    ```bash
    openclaw doctor
    ```

    Als de Gateway remote is, zorg er dan voor dat de tunnel-/Tailscale-verbinding actief is en dat de UI
    naar de juiste Gateway verwijst. Zie [Remote toegang](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Kan ik mijn setup naar een nieuwe machine (Mac mini) migreren zonder onboarding opnieuw te doen?">
    Ja. Kopieer de **statusmap** en **workspace**, en voer daarna eenmaal Doctor uit. Dit
    houdt je bot "exactly the same" (geheugen, sessiegeschiedenis, auth en kanaalstatus)
    zolang je **beide** locaties kopieert:

    1. Installeer OpenClaw op de nieuwe machine.
    2. Kopieer `$OPENCLAW_STATE_DIR` (standaard: `~/.openclaw`) vanaf de oude machine.
    3. Kopieer je workspace (standaard: `~/.openclaw/workspace`).
    4. Voer `openclaw doctor` uit en herstart de Gateway-service.

    Daarmee blijven configuratie, auth-profielen, WhatsApp-credentials, sessies en geheugen behouden. Als je in
    remote modus zit, onthoud dan dat de gatewayhost eigenaar is van de sessiestore en workspace.

    **Belangrijk:** als je alleen je workspace naar GitHub commit/pusht, maak je een back-up
    van **geheugen + bootstrapbestanden**, maar **niet** van sessiegeschiedenis of auth. Die staan
    onder `~/.openclaw/` (bijvoorbeeld `~/.openclaw/agents/<agentId>/sessions/`).

    Gerelateerd: [Migreren](/nl/install/migrating), [Waar dingen op schijf staan](#where-things-live-on-disk),
    [Agent-workspace](/nl/concepts/agent-workspace), [Doctor](/nl/gateway/doctor),
    [Remote modus](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Waar zie ik wat er nieuw is in de nieuwste versie?">
    Bekijk de GitHub-changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    De nieuwste vermeldingen staan bovenaan. Als de bovenste sectie is gemarkeerd als **Unreleased**, is de volgende gedateerde
    sectie de nieuwste uitgebrachte versie. Vermeldingen zijn gegroepeerd onder **Highlights**, **Wijzigingen** en
    **Fixes** (plus docs/andere secties wanneer nodig).

  </Accordion>

  <Accordion title="Geen toegang tot docs.openclaw.ai (SSL-fout)">
    Sommige Comcast-/Xfinity-verbindingen blokkeren `docs.openclaw.ai` ten onrechte via Xfinity
    Advanced Security. Schakel dit uit of zet `docs.openclaw.ai` op de allowlist, en probeer het daarna opnieuw.
    Help ons dit te deblokkeren door het hier te melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Als je de site nog steeds niet kunt bereiken, zijn de docs gespiegeld op GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Verschil tussen stable en beta">
    **Stable** en **beta** zijn **npm dist-tags**, geen afzonderlijke coderegels:

    - `latest` = stable
    - `beta` = vroege build om te testen

    Gewoonlijk komt een stable release eerst op **beta** terecht, waarna een expliciete
    promotiestap diezelfde versie naar `latest` verplaatst. Maintainers kunnen indien nodig ook
    rechtstreeks naar `latest` publiceren. Daarom kunnen beta en stable na promotie naar
    **dezelfde versie** verwijzen.

    Bekijk wat er is gewijzigd:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Zie de accordion hieronder voor installatie-one-liners en het verschil tussen beta en dev.

  </Accordion>

  <Accordion title="Hoe installeer ik de betaversie en wat is het verschil tussen beta en dev?">
    **Beta** is de npm dist-tag `beta` (kan na promotie overeenkomen met `latest`).
    **Dev** is de bewegende kop van `main` (git); wanneer gepubliceerd, gebruikt die de npm dist-tag `dev`.

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-installatieprogramma (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Meer details: [Ontwikkelingskanalen](/nl/install/development-channels) en [Installatieprogramma-vlaggen](/nl/install/installer).

  </Accordion>

  <Accordion title="Hoe probeer ik de nieuwste bits?">
    Twee opties:

    1. **Dev-kanaal (git-checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dit schakelt over naar de `main`-branch en werkt bij vanuit de broncode.

    2. **Aanpasbare installatie (vanaf de installatiesite):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daarmee krijg je een lokale repo die je kunt bewerken en daarna via git kunt bijwerken.

    Als je liever handmatig een schone clone gebruikt, gebruik dan:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentatie: [Bijwerken](/nl/cli/update), [Ontwikkelingskanalen](/nl/install/development-channels),
    [Installeren](/nl/install).

  </Accordion>

  <Accordion title="Hoe lang duren installatie en onboarding meestal?">
    Ruwe richtlijn:

    - **Installatie:** 2-5 minuten
    - **Onboarding:** 5-15 minuten, afhankelijk van hoeveel kanalen/modellen je configureert

    Als het blijft hangen, gebruik dan [Installatieprogramma vastgelopen](#quick-start-and-first-run-setup)
    en de snelle debugloop in [Ik zit vast](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installatieprogramma vastgelopen? Hoe krijg ik meer feedback?">
    Voer het installatieprogramma opnieuw uit met **uitgebreide uitvoer**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-installatie met uitgebreide uitvoer:

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

    Meer opties: [Installatieprogramma-vlaggen](/nl/install/installer).

  </Accordion>

  <Accordion title="Windows-installatie meldt dat git niet is gevonden of dat openclaw niet wordt herkend">
    Twee veelvoorkomende Windows-problemen:

    **1) npm-fout spawn git / git niet gevonden**

    - Installeer **Git for Windows** en zorg dat `git` op je PATH staat.
    - Sluit PowerShell en open het opnieuw, en voer daarna het installatieprogramma opnieuw uit.

    **2) openclaw wordt na installatie niet herkend**

    - Je globale npm-binmap staat niet op PATH.
    - Controleer het pad:

      ```powershell
      npm config get prefix
      ```

    - Voeg die map toe aan je gebruikers-PATH (geen `\bin`-achtervoegsel nodig op Windows; op de meeste systemen is dit `%AppData%\npm`).
    - Sluit PowerShell en open het opnieuw nadat je PATH hebt bijgewerkt.

    Als je de soepelste Windows-installatie wilt, gebruik dan **WSL2** in plaats van native Windows.
    Documentatie: [Windows](/nl/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec-uitvoer toont verminkte Chinese tekst - wat moet ik doen?">
    Dit is meestal een mismatch met de consolecodepagina in native Windows-shells.

    Symptomen:

    - `system.run`/`exec`-uitvoer toont Chinees als mojibake
    - Dezelfde opdracht ziet er goed uit in een ander terminalprofiel

    Snelle workaround in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Herstart daarna de Gateway en probeer je opdracht opnieuw:

    ```powershell
    openclaw gateway restart
    ```

    Als je dit nog steeds kunt reproduceren op de nieuwste OpenClaw, volg/meld het dan in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="De documentatie beantwoordde mijn vraag niet - hoe krijg ik een beter antwoord?">
    Gebruik de **aanpasbare (git-)installatie**, zodat je de volledige broncode en documentatie lokaal hebt, en vraag het daarna
    je bot (of Claude/Codex) _vanuit die map_, zodat die de repo kan lezen en precies kan antwoorden.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Meer details: [Installeren](/nl/install) en [Installatieprogramma-vlaggen](/nl/install/installer).

  </Accordion>

  <Accordion title="Hoe installeer ik OpenClaw op Linux?">
    Kort antwoord: volg de Linux-gids en voer daarna onboarding uit.

    - Snel Linux-pad + service-installatie: [Linux](/nl/platforms/linux).
    - Volledige walkthrough: [Aan de slag](/nl/start/getting-started).
    - Installatieprogramma + updates: [Installatie en updates](/nl/install/updating).

  </Accordion>

  <Accordion title="Hoe installeer ik OpenClaw op een VPS?">
    Elke Linux-VPS werkt. Installeer op de server en gebruik daarna SSH/Tailscale om de Gateway te bereiken.

    Gidsen: [exe.dev](/nl/install/exe-dev), [Hetzner](/nl/install/hetzner), [Fly.io](/nl/install/fly).
    Externe toegang: [Gateway op afstand](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Waar zijn de cloud-/VPS-installatiegidsen?">
    We onderhouden een **hostinghub** met de gangbare providers. Kies er een en volg de gids:

    - [VPS-hosting](/nl/vps) (alle providers op één plek)
    - [Fly.io](/nl/install/fly)
    - [Hetzner](/nl/install/hetzner)
    - [exe.dev](/nl/install/exe-dev)

    Zo werkt het in de cloud: de **Gateway draait op de server**, en je opent die
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
    Gateway herstarten (waardoor de actieve sessie wegvalt), kan een schone git-checkout nodig hebben en
    kan om bevestiging vragen. Veiliger: voer updates uit vanuit een shell als operator.

    Gebruik de CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Als je toch vanuit een agent moet automatiseren:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentatie: [Bijwerken](/nl/cli/update), [Updaten](/nl/install/updating).

  </Accordion>

  <Accordion title="Wat doet onboarding eigenlijk?">
    `openclaw onboard` is het aanbevolen installatiepad. In **lokale modus** leidt het je door:

    - **Model-/auth-installatie** (provider-OAuth, API-sleutels, Anthropic setup-token, plus lokale modelopties zoals LM Studio)
    - **Workspace**-locatie + bootstrapbestanden
    - **Gateway-instellingen** (bind/port/auth/tailscale)
    - **Kanalen** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus gebundelde kanaalplugins zoals QQ Bot)
    - **Daemon-installatie** (LaunchAgent op macOS; systemd-gebruikerseenheid op Linux/WSL2)
    - **Gezondheidscontroles** en selectie van **Skills**

    Het waarschuwt ook als je geconfigureerde model onbekend is of auth ontbreekt.

  </Accordion>

  <Accordion title="Heb ik een Claude- of OpenAI-abonnement nodig om dit te draaien?">
    Nee. Je kunt OpenClaw draaien met **API-sleutels** (Anthropic/OpenAI/anderen) of met
    **alleen-lokale modellen**, zodat je gegevens op je apparaat blijven. Abonnementen (Claude
    Pro/Max of OpenAI Codex) zijn optionele manieren om bij die providers te authenticeren.

    Voor Anthropic in OpenClaw is de praktische verdeling:

    - **Anthropic API-sleutel**: normale Anthropic API-facturering
    - **Claude CLI / Claude-abonnementsauth in OpenClaw**: Anthropic-medewerkers
      hebben ons verteld dat dit gebruik weer is toegestaan, en OpenClaw behandelt `claude -p`-
      gebruik als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw
      beleid publiceert

    Voor lang draaiende gatewayhosts blijven Anthropic API-sleutels de meer
    voorspelbare installatie. OpenAI Codex OAuth wordt expliciet ondersteund voor externe
    tools zoals OpenClaw.

    OpenClaw ondersteunt ook andere gehoste opties in abonnementsstijl, waaronder
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** en
    **Z.AI / GLM Coding Plan**.

    Documentatie: [Anthropic](/nl/providers/anthropic), [OpenAI](/nl/providers/openai),
    [Qwen Cloud](/nl/providers/qwen),
    [MiniMax](/nl/providers/minimax), [GLM Models](/nl/providers/glm),
    [Lokale modellen](/nl/gateway/local-models), [Modellen](/nl/concepts/models).

  </Accordion>

  <Accordion title="Kan ik een Claude Max-abonnement gebruiken zonder API-sleutel?">
    Ja.

    Anthropic-medewerkers hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl weer is toegestaan, dus
    OpenClaw behandelt Claude-abonnementsauth en `claude -p`-gebruik als goedgekeurd
    voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Als je
    de meest voorspelbare server-side installatie wilt, gebruik dan in plaats daarvan een Anthropic API-sleutel.

  </Accordion>

  <Accordion title="Ondersteunen jullie Claude-abonnementsauth (Claude Pro of Max)?">
    Ja.

    Anthropic-medewerkers hebben ons verteld dat dit gebruik weer is toegestaan, dus OpenClaw behandelt
    hergebruik van Claude CLI en `claude -p`-gebruik als goedgekeurd voor deze integratie,
    tenzij Anthropic een nieuw beleid publiceert.

    Anthropic setup-token is nog steeds beschikbaar als ondersteund OpenClaw-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI en `claude -p` wanneer beschikbaar.
    Voor productie- of multi-user workloads blijft Anthropic API-sleutelauth de
    veiligere, meer voorspelbare keuze. Als je andere gehoste opties in abonnementsstijl
    in OpenClaw wilt, zie [OpenAI](/nl/providers/openai), [Qwen / Model
    Cloud](/nl/providers/qwen), [MiniMax](/nl/providers/minimax) en [GLM
    Models](/nl/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Waarom zie ik HTTP 429 rate_limit_error van Anthropic?">
    Dat betekent dat je **Anthropic-quotum/rate limit** is uitgeput voor het huidige venster. Als je
    **Claude CLI** gebruikt, wacht dan tot het venster wordt gereset of upgrade je abonnement. Als je
    een **Anthropic API-sleutel** gebruikt, controleer dan de Anthropic Console
    op gebruik/facturering en verhoog limieten indien nodig.

    Als het bericht specifiek is:
    `Extra usage is required for long context requests`, probeert de aanvraag
    Anthropic's 1M-contextbeta (`context1m: true`) te gebruiken. Dat werkt alleen wanneer je
    credential in aanmerking komt voor long-context-facturering (API-sleutelfacturering of het
    OpenClaw Claude-loginpad met Extra Usage ingeschakeld).

    Tip: stel een **fallbackmodel** in zodat OpenClaw kan blijven antwoorden terwijl een provider door rate limits wordt beperkt.
    Zie [Modellen](/nl/cli/models), [OAuth](/nl/concepts/oauth), en
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/nl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wordt AWS Bedrock ondersteund?">
    Ja. OpenClaw heeft een gebundelde **Amazon Bedrock (Converse)**-provider. Met aanwezige AWS-env-markers kan OpenClaw de streaming/tekst-Bedrock-catalogus automatisch ontdekken en samenvoegen als een impliciete `amazon-bedrock`-provider; anders kun je `plugins.entries.amazon-bedrock.config.discovery.enabled` expliciet inschakelen of een handmatige providervermelding toevoegen. Zie [Amazon Bedrock](/nl/providers/bedrock) en [Modelproviders](/nl/providers/models). Als je een beheerde sleutelstroom verkiest, blijft een OpenAI-compatibele proxy vóór Bedrock een geldige optie.
  </Accordion>

  <Accordion title="Hoe werkt Codex-authenticatie?">
    OpenClaw ondersteunt **OpenAI Code (Codex)** via OAuth (aanmelden met ChatGPT). Gebruik
    `openai/gpt-5.5` met `agentRuntime.id: "codex"` voor de gebruikelijke setup:
    ChatGPT/Codex-abonnementsauthenticatie plus uitvoering via de native Codex-appserver. Gebruik
    `openai-codex/gpt-5.5` alleen wanneer je Codex OAuth via de standaard
    PI-runner wilt. Gebruik `openai/gpt-5.5` zonder de Codex-runtime-override voor
    directe toegang met een OpenAI-API-sleutel.
    Zie [Modelproviders](/nl/concepts/model-providers) en [Onboarding (CLI)](/nl/start/wizard).
  </Accordion>

  <Accordion title="Waarom noemt OpenClaw nog steeds openai-codex?">
    `openai-codex` is de provider- en auth-profile-id voor ChatGPT/Codex OAuth.
    Het is ook het expliciete PI-modelprefix voor Codex OAuth:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = ChatGPT/Codex-abonnementsauthenticatie met native Codex-runtime
    - `openai-codex/gpt-5.5` = Codex OAuth-route in PI
    - `openai/gpt-5.5` zonder Codex-runtime-override = directe OpenAI-API-sleutelroute in PI
    - `openai-codex:...` = auth-profiel-id, geen modelverwijzing

    Als je het directe facturerings-/limietpad van OpenAI Platform wilt, stel dan
    `OPENAI_API_KEY` in. Als je ChatGPT/Codex-abonnementsauthenticatie wilt, meld je aan met
    `openclaw models auth login --provider openai-codex`. Voor native Codex-
    runtime behoud je de modelverwijzing als `openai/gpt-5.5` en stel je
    `agentRuntime.id: "codex"` in. Gebruik `openai-codex/*`-modelverwijzingen alleen voor PI-
    runs.

  </Accordion>

  <Accordion title="Waarom kunnen Codex OAuth-limieten verschillen van ChatGPT web?">
    Codex OAuth gebruikt door OpenAI beheerde, planafhankelijke quotavensters. In de praktijk
    kunnen die limieten verschillen van de ervaring op de ChatGPT-website/app, zelfs wanneer
    beide aan hetzelfde account zijn gekoppeld.

    OpenClaw kan de momenteel zichtbare gebruiks-/quotavensters van providers tonen in
    `openclaw models status`, maar het verzint of normaliseert geen ChatGPT-web-
    rechten naar directe API-toegang. Als je het directe facturerings-/limietpad van OpenAI Platform
    wilt, gebruik dan `openai/*` met een API-sleutel.

  </Accordion>

  <Accordion title="Ondersteunen jullie OpenAI-abonnementsauthenticatie (Codex OAuth)?">
    Ja. OpenClaw ondersteunt **OpenAI Code (Codex) subscription OAuth** volledig.
    OpenAI staat gebruik van subscription OAuth expliciet toe in externe tools/workflows
    zoals OpenClaw. Onboarding kan de OAuth-stroom voor je uitvoeren.

    Zie [OAuth](/nl/concepts/oauth), [Modelproviders](/nl/concepts/model-providers), en [Onboarding (CLI)](/nl/start/wizard).

  </Accordion>

  <Accordion title="Hoe stel ik Gemini CLI OAuth in?">
    Gemini CLI gebruikt een **Plugin-authenticatiestroom**, geen client-id of secret in `openclaw.json`.

    Stappen:

    1. Installeer Gemini CLI lokaal zodat `gemini` op `PATH` staat
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Schakel de Plugin in: `openclaw plugins enable google`
    3. Meld je aan: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standaardmodel na aanmelden: `google-gemini-cli/gemini-3-flash-preview`
    5. Als aanvragen mislukken, stel dan `GOOGLE_CLOUD_PROJECT` of `GOOGLE_CLOUD_PROJECT_ID` in op de gatewayhost

    Dit slaat OAuth-tokens op in auth-profielen op de gatewayhost. Details: [Modelproviders](/nl/concepts/model-providers).

  </Accordion>

  <Accordion title="Is een lokaal model oké voor informele chats?">
    Meestal niet. OpenClaw heeft grote context + sterke veiligheid nodig; kleine kaarten kappen af en lekken. Als het moet, draai dan de **grootste** modelbuild die je lokaal kunt draaien (LM Studio) en zie [/gateway/local-models](/nl/gateway/local-models). Kleinere/gekwantiseerde modellen vergroten het risico op promptinjectie - zie [Beveiliging](/nl/gateway/security).
  </Accordion>

  <Accordion title="Hoe houd ik verkeer naar gehoste modellen in een specifieke regio?">
    Kies regionaal vastgepinde endpoints. OpenRouter biedt in de VS gehoste opties voor MiniMax, Kimi en GLM; kies de in de VS gehoste variant om data binnen de regio te houden. Je kunt Anthropic/OpenAI nog steeds daarnaast opnemen door `models.mode: "merge"` te gebruiken, zodat fallbacks beschikbaar blijven terwijl de geregionaliseerde provider die je selecteert wordt gerespecteerd.
  </Accordion>

  <Accordion title="Moet ik een Mac Mini kopen om dit te installeren?">
    Nee. OpenClaw draait op macOS of Linux (Windows via WSL2). Een Mac mini is optioneel - sommige mensen
    kopen er een als altijd-aan-host, maar een kleine VPS, thuisserver of Raspberry Pi-klasse box werkt ook.

    Je hebt alleen een Mac nodig **voor tools die alleen op macOS werken**. Gebruik voor iMessage [BlueBubbles](/nl/channels/bluebubbles) (aanbevolen) - de BlueBubbles-server draait op elke Mac, en de Gateway kan op Linux of elders draaien. Als je andere tools wilt die alleen op macOS werken, draai de Gateway dan op een Mac of koppel een macOS-node.

    Docs: [BlueBubbles](/nl/channels/bluebubbles), [Nodes](/nl/nodes), [Mac remote mode](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Heb ik een Mac mini nodig voor iMessage-ondersteuning?">
    Je hebt **een macOS-apparaat** nodig dat is aangemeld bij Berichten. Dat hoeft **geen** Mac mini te zijn -
    elke Mac werkt. **Gebruik [BlueBubbles](/nl/channels/bluebubbles)** (aanbevolen) voor iMessage - de BlueBubbles-server draait op macOS, terwijl de Gateway op Linux of elders kan draaien.

    Veelvoorkomende setups:

    - Draai de Gateway op Linux/VPS, en draai de BlueBubbles-server op een Mac die is aangemeld bij Berichten.
    - Draai alles op de Mac als je de eenvoudigste setup met één machine wilt.

    Docs: [BlueBubbles](/nl/channels/bluebubbles), [Nodes](/nl/nodes),
    [Mac remote mode](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Als ik een Mac mini koop om OpenClaw te draaien, kan ik die dan met mijn MacBook Pro verbinden?">
    Ja. De **Mac mini kan de Gateway draaien**, en je MacBook Pro kan verbinden als een
    **node** (begeleidend apparaat). Nodes draaien de Gateway niet - ze bieden extra
    mogelijkheden zoals scherm/camera/canvas en `system.run` op dat apparaat.

    Veelvoorkomend patroon:

    - Gateway op de Mac mini (altijd aan).
    - MacBook Pro draait de macOS-app of een nodehost en koppelt met de Gateway.
    - Gebruik `openclaw nodes status` / `openclaw nodes list` om dit te bekijken.

    Docs: [Nodes](/nl/nodes), [Nodes CLI](/nl/cli/nodes).

  </Accordion>

  <Accordion title="Kan ik Bun gebruiken?">
    Bun wordt **niet aanbevolen**. We zien runtimebugs, vooral met WhatsApp en Telegram.
    Gebruik **Node** voor stabiele gateways.

    Als je toch met Bun wilt experimenteren, doe dat dan op een niet-productie-gateway
    zonder WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: wat komt er in allowFrom?">
    `channels.telegram.allowFrom` is **de Telegram-gebruikers-ID van de menselijke afzender** (numeriek). Het is niet de botgebruikersnaam.

    De setup vraagt alleen om numerieke gebruikers-ID's. Als je al verouderde `@username`-vermeldingen in de configuratie hebt, kan `openclaw doctor --fix` proberen ze op te lossen.

    Veiliger (geen bot van derden):

    - Stuur je bot een DM, voer daarna `openclaw logs --follow` uit en lees `from.id`.

    Officiële Bot API:

    - Stuur je bot een DM, roep daarna `https://api.telegram.org/bot<bot_token>/getUpdates` aan en lees `message.from.id`.

    Derde partij (minder privé):

    - DM `@userinfobot` of `@getidsbot`.

    Zie [/channels/telegram](/nl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Kunnen meerdere mensen één WhatsApp-nummer gebruiken met verschillende OpenClaw-instanties?">
    Ja, via **multi-agent routing**. Koppel de WhatsApp-**DM** van elke afzender (peer `kind: "direct"`, afzender in E.164 zoals `+15551234567`) aan een andere `agentId`, zodat elke persoon zijn eigen workspace en sessieopslag krijgt. Antwoorden komen nog steeds van hetzelfde **WhatsApp-account**, en toegangscontrole voor DM's (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) is globaal per WhatsApp-account. Zie [Multi-Agent Routing](/nl/concepts/multi-agent) en [WhatsApp](/nl/channels/whatsapp).
  </Accordion>

  <Accordion title='Kan ik een "snelle chat"-agent en een "Opus voor coderen"-agent draaien?'>
    Ja. Gebruik multi-agent routing: geef elke agent zijn eigen standaardmodel en koppel vervolgens inkomende routes (provideraccount of specifieke peers) aan elke agent. Voorbeeldconfiguratie staat in [Multi-Agent Routing](/nl/concepts/multi-agent). Zie ook [Modellen](/nl/concepts/models) en [Configuratie](/nl/gateway/configuration).
  </Accordion>

  <Accordion title="Werkt Homebrew op Linux?">
    Ja. Homebrew ondersteunt Linux (Linuxbrew). Snelle setup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Als je OpenClaw via systemd draait, zorg er dan voor dat het service-PATH `/home/linuxbrew/.linuxbrew/bin` (of je brew-prefix) bevat, zodat met `brew` geïnstalleerde tools worden gevonden in non-login shells.
    Recente builds voegen ook gangbare gebruikers-bin-mappen toe aan het begin van Linux-systemd-services (bijvoorbeeld `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) en respecteren `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` en `FNM_DIR` wanneer ze zijn ingesteld.

  </Accordion>

  <Accordion title="Verschil tussen de hackbare git-installatie en npm-installatie">
    - **Hackbare (git) installatie:** volledige source-checkout, bewerkbaar, het beste voor contributors.
      Je voert builds lokaal uit en kunt code/docs patchen.
    - **npm-installatie:** globale CLI-installatie, geen repo, het beste voor "gewoon draaien."
      Updates komen van npm dist-tags.

    Docs: [Aan de slag](/nl/start/getting-started), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Kan ik later wisselen tussen npm- en git-installaties?">
    Ja. Gebruik `openclaw update --channel ...` wanneer OpenClaw al is geïnstalleerd.
    Dit **verwijdert je data niet** - het verandert alleen de code-installatie van OpenClaw.
    Je status (`~/.openclaw`) en workspace (`~/.openclaw/workspace`) blijven onaangeroerd.

    Van npm naar git:

    ```bash
    openclaw update --channel dev
    ```

    Van git naar npm:

    ```bash
    openclaw update --channel stable
    ```

    Voeg `--dry-run` toe om eerst een voorbeeld van de geplande moduswissel te bekijken. De updater voert
    Doctor-vervolgstappen uit, vernieuwt Plugin-bronnen voor het doelkanaal en
    herstart de gateway tenzij je `--no-restart` meegeeft.

    De installer kan beide modi ook afdwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Back-uptips: zie [Back-upstrategie](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Moet ik de Gateway op mijn laptop of op een VPS draaien?">
    Kort antwoord: **als je 24/7-betrouwbaarheid wilt, gebruik dan een VPS**. Als je de
    minste frictie wilt en slaapstand/herstarts oké vindt, draai hem dan lokaal.

    **Laptop (lokale Gateway)**

    - **Voordelen:** geen serverkosten, directe toegang tot lokale bestanden, live browservenster.
    - **Nadelen:** slaapstand/netwerkuitval = verbroken verbindingen, OS-updates/herstarts onderbreken, moet wakker blijven.

    **VPS / cloud**

    - **Voordelen:** altijd aan, stabiel netwerk, geen problemen met laptopslaapstand, gemakkelijker actief te houden.
    - **Nadelen:** vaak headless uitgevoerd (gebruik screenshots), alleen externe bestandstoegang, je moet SSH gebruiken voor updates.

    **OpenClaw-specifieke opmerking:** WhatsApp/Telegram/Slack/Mattermost/Discord werken allemaal prima vanaf een VPS. De enige echte afweging is **headless browser** versus een zichtbaar venster. Zie [Browser](/nl/tools/browser).

    **Aanbevolen standaard:** VPS als je eerder Gateway-verbindingsonderbrekingen had. Lokaal is geweldig wanneer je de Mac actief gebruikt en lokale bestandstoegang of UI-automatisering met een zichtbare browser wilt.

  </Accordion>

  <Accordion title="Hoe belangrijk is het om OpenClaw op een toegewezen machine uit te voeren?">
    Niet vereist, maar **aanbevolen voor betrouwbaarheid en isolatie**.

    - **Toegewezen host (VPS/Mac mini/Pi):** altijd aan, minder onderbrekingen door slaapstand/herstarten, schonere machtigingen, gemakkelijker actief te houden.
    - **Gedeelde laptop/desktop:** helemaal prima voor testen en actief gebruik, maar verwacht pauzes wanneer de machine in slaapstand gaat of updates uitvoert.

    Als je het beste van beide werelden wilt, houd de Gateway dan op een toegewezen host en koppel je laptop als een **node** voor lokale scherm-/camera-/exec-tools. Zie [Nodes](/nl/nodes).
    Lees [Security](/nl/gateway/security) voor beveiligingsrichtlijnen.

  </Accordion>

  <Accordion title="Wat zijn de minimale VPS-vereisten en het aanbevolen OS?">
    OpenClaw is lichtgewicht. Voor een eenvoudige Gateway + één chatkanaal:

    - **Absoluut minimum:** 1 vCPU, 1GB RAM, ~500MB schijf.
    - **Aanbevolen:** 1-2 vCPU, 2GB RAM of meer voor speelruimte (logs, media, meerdere kanalen). Node-tools en browserautomatisering kunnen veel resources gebruiken.

    OS: gebruik **Ubuntu LTS** (of een moderne Debian/Ubuntu). Het Linux-installatiepad is daar het best getest.

    Docs: [Linux](/nl/platforms/linux), [VPS-hosting](/nl/vps).

  </Accordion>

  <Accordion title="Kan ik OpenClaw in een VM uitvoeren en wat zijn de vereisten?">
    Ja. Behandel een VM hetzelfde als een VPS: deze moet altijd aan zijn, bereikbaar zijn en voldoende
    RAM hebben voor de Gateway en alle kanalen die je inschakelt.

    Basisrichtlijnen:

    - **Absoluut minimum:** 1 vCPU, 1GB RAM.
    - **Aanbevolen:** 2GB RAM of meer als je meerdere kanalen, browserautomatisering of mediatools uitvoert.
    - **OS:** Ubuntu LTS of een andere moderne Debian/Ubuntu.

    Als je Windows gebruikt, is **WSL2 de eenvoudigste VM-achtige setup** en heeft het de beste compatibiliteit
    met tooling. Zie [Windows](/nl/platforms/windows), [VPS-hosting](/nl/vps).
    Als je macOS in een VM uitvoert, zie [macOS VM](/nl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [FAQ](/nl/help/faq) — de hoofd-FAQ (modellen, sessies, Gateway, beveiliging, meer)
- [Installatieoverzicht](/nl/install)
- [Aan de slag](/nl/start/getting-started)
- [Probleemoplossing](/nl/help/troubleshooting)
