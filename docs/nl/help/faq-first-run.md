---
read_when:
    - Nieuwe installatie, onboarding loopt vast of fouten bij de eerste uitvoering
    - Verificatie- en providerabonnementen kiezen
    - Geen toegang tot docs.openclaw.ai, kan dashboard niet openen, installatie vastgelopen
sidebarTitle: First-run FAQ
summary: 'FAQ: snelstart en configuratie bij eerste gebruik — installeren, onboarden, authenticatie, abonnementen, eerste fouten'
title: 'Veelgestelde vragen: installatie bij eerste gebruik'
x-i18n:
    generated_at: "2026-06-27T17:39:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  Q&A voor snelle start en eerste uitvoering. Zie de hoofd-[FAQ](/nl/help/faq) voor dagelijkse bewerkingen, modellen, auth, sessies en probleemoplossing.

  ## Snelle start en eerste configuratie

  <AccordionGroup>
  <Accordion title="Ik zit vast, snelste manier om weer verder te komen">
    Gebruik een lokale AI-agent die **je machine kan zien**. Dat is veel effectiever dan vragen
    in Discord, omdat de meeste gevallen van "ik zit vast" **lokale configuratie- of omgevingsproblemen** zijn die
    externe helpers niet kunnen inspecteren.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Deze tools kunnen de repo lezen, opdrachten uitvoeren, logs inspecteren en helpen je configuratie op machineniveau
    te herstellen (PATH, services, rechten, auth-bestanden). Geef ze de **volledige source-checkout** via
    de hackbare (git-)installatie:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Hiermee installeer je OpenClaw **vanuit een git-checkout**, zodat de agent de code + docs kan lezen en
    kan redeneren over de exacte versie die je gebruikt. Je kunt later altijd terugschakelen naar stable
    door de installer opnieuw uit te voeren zonder `--install-method git`.

    Tip: vraag de agent om de oplossing **te plannen en te begeleiden** (stap voor stap), en voer daarna alleen de
    noodzakelijke opdrachten uit. Zo blijven wijzigingen klein en makkelijker te auditen.

    Als je een echte bug of fix ontdekt, maak dan een GitHub-issue aan of stuur een PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Begin met deze opdrachten (deel de uitvoer wanneer je om hulp vraagt):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Wat ze doen:

    - `openclaw status`: snelle momentopname van Gateway-/agentstatus + basisconfiguratie.
    - `openclaw models status`: controleert provider-auth + modelbeschikbaarheid.
    - `openclaw doctor`: valideert en repareert veelvoorkomende configuratie-/statusproblemen.

    Andere nuttige CLI-controles: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Snelle debugloop: [Eerste 60 seconden als er iets kapot is](/nl/help/faq#first-60-seconds-if-something-is-broken).
    Installatiedocs: [Installeren](/nl/install), [Installer-flags](/nl/install/installer), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Heartbeat blijft overslaan. Wat betekenen de oversla-redenen?">
    Veelvoorkomende Heartbeat-oversla-redenen:

    - `quiet-hours`: buiten het geconfigureerde venster met actieve uren
    - `empty-heartbeat-file`: `HEARTBEAT.md` bestaat, maar bevat alleen lege regels, comments, koppen, fences of lege checklist-scaffolding
    - `no-tasks-due`: `HEARTBEAT.md`-taakmodus is actief, maar geen van de taakintervallen is al aan de beurt
    - `alerts-disabled`: alle Heartbeat-zichtbaarheid is uitgeschakeld (`showOk`, `showAlerts` en `useIndicator` staan allemaal uit)

    In taakmodus worden due-timestamps pas bijgewerkt nadat een echte Heartbeat-run
    is voltooid. Overgeslagen runs markeren taken niet als voltooid.

    Docs: [Heartbeat](/nl/gateway/heartbeat), [Automatisering](/nl/automation).

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

    Als je nog geen globale installatie hebt, voer het dan uit via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Hoe open ik het dashboard na onboarding?">
    De wizard opent direct na onboarding je browser met een schone (niet-getokeniseerde) dashboard-URL en drukt de link ook af in de samenvatting. Houd dat tabblad open; als het niet is gestart, kopieer/plak dan de afgedrukte URL op dezelfde machine.
  </Accordion>

  <Accordion title="Hoe authenticeer ik het dashboard op localhost versus remote?">
    **Localhost (dezelfde machine):**

    - Open `http://127.0.0.1:18789/`.
    - Als om shared-secret-auth wordt gevraagd, plak dan het geconfigureerde token of wachtwoord in de Control UI-instellingen.
    - Tokenbron: `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`).
    - Wachtwoordbron: `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`).
    - Als er nog geen gedeeld geheim is geconfigureerd, genereer dan een token met `openclaw doctor --generate-gateway-token`.

    **Niet op localhost:**

    - **Tailscale Serve** (aanbevolen): houd bind op local loopback, voer `openclaw gateway --tailscale serve` uit, open `https://<magicdns>/`. Als `gateway.auth.allowTailscale` `true` is, voldoen identity-headers voor Control UI-/WebSocket-auth (geen geplakt gedeeld geheim, gaat uit van een vertrouwde Gateway-host); HTTP-API's vereisen nog steeds shared-secret-auth, tenzij je bewust private-ingress `none` of trusted-proxy-HTTP-auth gebruikt.
      Slechte gelijktijdige Serve-auth-pogingen vanaf dezelfde client worden geserialiseerd voordat de failed-auth-limiter ze registreert, dus de tweede slechte retry kan al `retry later` tonen.
    - **Tailnet-bind**: voer `openclaw gateway --bind tailnet --token "<token>"` uit (of configureer wachtwoord-auth), open `http://<tailscale-ip>:18789/` en plak daarna het bijbehorende gedeelde geheim in de dashboardinstellingen.
    - **Identity-aware reverse proxy**: houd de Gateway achter een vertrouwde proxy, configureer `gateway.auth.mode: "trusted-proxy"` en open daarna de proxy-URL. Loopback-proxy's op dezelfde host vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`. Shared-secret-auth blijft gelden via de tunnel; plak het geconfigureerde token of wachtwoord als daarom wordt gevraagd.

    Zie [Dashboard](/nl/web/dashboard) en [Web-oppervlakken](/nl/web) voor bind-modi en auth-details.

  </Accordion>

  <Accordion title="Waarom zijn er twee exec-goedkeuringsconfigs voor chatgoedkeuringen?">
    Ze regelen verschillende lagen:

    - `approvals.exec`: stuurt goedkeuringsprompts door naar chatbestemmingen
    - `channels.<channel>.execApprovals`: laat dat kanaal optreden als native goedkeuringsclient voor exec-goedkeuringen

    Het exec-beleid van de host blijft de echte goedkeuringspoort. Chatconfiguratie bepaalt alleen waar goedkeuringsprompts
    verschijnen en hoe mensen erop kunnen antwoorden.

    In de meeste setups heb je **niet** allebei nodig:

    - Als de chat al opdrachten en antwoorden ondersteunt, werkt `/approve` in dezelfde chat via het gedeelde pad.
    - Als een ondersteund native kanaal approvers veilig kan afleiden, schakelt OpenClaw nu automatisch DM-first native goedkeuringen in wanneer `channels.<channel>.execApprovals.enabled` niet is ingesteld of `"auto"` is.
    - Wanneer native goedkeuringskaarten/-knoppen beschikbaar zijn, is die native UI het primaire pad; de agent zou alleen een handmatige `/approve`-opdracht moeten opnemen als het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of handmatige goedkeuring het enige pad is.
    - Gebruik `approvals.exec` alleen wanneer prompts ook naar andere chats of expliciete ops-ruimtes moeten worden doorgestuurd.
    - Gebruik `channels.<channel>.execApprovals.target: "channel"` of `"both"` alleen wanneer je expliciet wilt dat goedkeuringsprompts terug in de oorspronkelijke ruimte/topic worden geplaatst.
    - Plugin-goedkeuringen zijn opnieuw apart: ze gebruiken standaard `/approve` in dezelfde chat, optionele `approvals.plugin`-doorsturing, en slechts enkele native kanalen houden daarbovenop plugin-goedkeuring-native-afhandeling aan.

    Korte versie: doorsturen is voor routing, native-clientconfiguratie is voor rijkere kanaalspecifieke UX.
    Zie [Exec-goedkeuringen](/nl/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welke runtime heb ik nodig?">
    Node **>= 22** is vereist. `pnpm` wordt aanbevolen. Bun wordt **niet aanbevolen** voor de Gateway.
  </Accordion>

  <Accordion title="Draait het op Raspberry Pi?">
    Ja. De Gateway is lichtgewicht - de docs vermelden **512 MB-1 GB RAM**, **1 core** en ongeveer **500 MB**
    schijfruimte als voldoende voor persoonlijk gebruik, en merken op dat een **Raspberry Pi 4 het kan draaien**.

    Als je extra speelruimte wilt (logs, media, andere services), wordt **2 GB aanbevolen**, maar het is
    geen harde minimumvereiste.

    Tip: een kleine Raspberry Pi/VPS kan de Gateway hosten, en je kunt **nodes** op je laptop/telefoon koppelen voor
    lokale scherm-/camera-/canvas- of opdrachtuitvoering. Zie [Nodes](/nl/nodes).

  </Accordion>

  <Accordion title="Tips voor Raspberry Pi-installaties?">
    Korte versie: het werkt, maar verwacht ruwe randjes.

    - Gebruik een **64-bit** OS en houd Node >= 22.
    - Geef de voorkeur aan de **hackbare (git-)installatie**, zodat je logs kunt zien en snel kunt updaten.
    - Begin zonder kanalen/skills en voeg ze daarna één voor één toe.
    - Als je vreemde binaire problemen tegenkomt, is dat meestal een **ARM-compatibiliteitsprobleem**.

    Docs: [Linux](/nl/platforms/linux), [Installeren](/nl/install).

  </Accordion>

  <Accordion title="Het blijft hangen op wake up my friend / onboarding wil niet hatchen. Wat nu?">
    Dat scherm hangt af van of de Gateway bereikbaar en geauthenticeerd is. De TUI verstuurt ook
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

    Als de Gateway remote is, zorg dan dat de tunnel-/Tailscale-verbinding actief is en dat de UI
    naar de juiste Gateway verwijst. Zie [Remote access](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Kan ik mijn setup naar een nieuwe machine (Mac mini) migreren zonder onboarding opnieuw te doen?">
    Ja. Kopieer de **statusdirectory** en **workspace**, en voer daarna Doctor één keer uit. Dit
    houdt je bot "exactly the same" (geheugen, sessiegeschiedenis, auth en kanaalstatus), zolang je **beide** locaties kopieert:

    1. Installeer OpenClaw op de nieuwe machine.
    2. Kopieer `$OPENCLAW_STATE_DIR` (standaard: `~/.openclaw`) vanaf de oude machine.
    3. Kopieer je workspace (standaard: `~/.openclaw/workspace`).
    4. Voer `openclaw doctor` uit en herstart de Gateway-service.

    Daarmee blijven configuratie, auth-profielen, WhatsApp-creds, sessies en geheugen behouden. Als je in
    remote-modus werkt, onthoud dan dat de Gateway-host eigenaar is van de session store en workspace.

    **Belangrijk:** als je alleen je workspace commit/pusht naar GitHub, maak je een back-up
    van **geheugen + bootstrap-bestanden**, maar **niet** van sessiegeschiedenis of auth. Die staan
    onder `~/.openclaw/` (bijvoorbeeld `~/.openclaw/agents/<agentId>/sessions/`).

    Gerelateerd: [Migreren](/nl/install/migrating), [Waar dingen op schijf staan](/nl/help/faq#where-things-live-on-disk),
    [Agent-workspace](/nl/concepts/agent-workspace), [Doctor](/nl/gateway/doctor),
    [Remote-modus](/nl/gateway/remote).

  </Accordion>

  <Accordion title="Waar zie ik wat er nieuw is in de nieuwste versie?">
    Bekijk de GitHub-changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    De nieuwste vermeldingen staan bovenaan. Als de bovenste sectie is gemarkeerd als **Unreleased**, is de volgende gedateerde
    sectie de nieuwste uitgebrachte versie. Vermeldingen zijn gegroepeerd op **Highlights**, **Wijzigingen** en
    **Fixes** (plus docs/andere secties wanneer nodig).

  </Accordion>

  <Accordion title="Geen toegang tot docs.openclaw.ai (SSL-fout)">
    Sommige Comcast-/Xfinity-verbindingen blokkeren `docs.openclaw.ai` onterecht via Xfinity
    Advanced Security. Schakel dit uit of zet `docs.openclaw.ai` op de allowlist en probeer het opnieuw.
    Help ons dit te deblokkeren door het hier te melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Als je de site nog steeds niet kunt bereiken, staan de docs gespiegeld op GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Verschil tussen stable en beta">
    **Stable** en **beta** zijn **npm dist-tags**, geen afzonderlijke coderegels:

    - `latest` = stable
    - `beta` = vroege build om te testen

    Meestal landt een stable-release eerst op **beta**, waarna een expliciete
    promotiestap diezelfde versie naar `latest` verplaatst. Maintainers kunnen ook
    rechtstreeks naar `latest` publiceren wanneer dat nodig is. Daarom kunnen beta en stable
    na promotie naar **dezelfde versie** verwijzen.

    Bekijk wat er is gewijzigd:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Zie de accordion hieronder voor installatie-one-liners en het verschil tussen beta en dev.

  </Accordion>

  <Accordion title="Hoe installeer ik de beta-versie en wat is het verschil tussen beta en dev?">
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

    Meer details: [Ontwikkelingskanalen](/nl/install/development-channels) en [Installer-vlaggen](/nl/install/installer).

  </Accordion>

  <Accordion title="Hoe probeer ik de nieuwste bits?">
    Twee opties:

    1. **Dev-kanaal (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dit schakelt over naar de `main`-branch en werkt bij vanuit de broncode.

    2. **Aanpasbare installatie (vanaf de installatiesite):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dat geeft je een lokale repo die je kunt bewerken en daarna via git kunt bijwerken.

    Als je liever handmatig een schone clone gebruikt, gebruik dan:

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
    en de snelle debuglus in [Ik zit vast](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer vastgelopen? Hoe krijg ik meer feedback?">
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

    Meer opties: [Installer-vlaggen](/nl/install/installer).

  </Accordion>

  <Accordion title="Windows-installatie zegt dat git niet is gevonden of openclaw niet wordt herkend">
    Twee veelvoorkomende Windows-problemen:

    **1) npm-fout spawn git / git niet gevonden**

    - Installeer **Git for Windows** en zorg ervoor dat `git` op je PATH staat.
    - Sluit PowerShell en open het opnieuw, en voer daarna het installatieprogramma opnieuw uit.

    **2) openclaw wordt na installatie niet herkend**

    - Je globale npm-binmap staat niet op PATH.
    - Controleer het pad:

      ```powershell
      npm config get prefix
      ```

    - Voeg die directory toe aan je gebruikers-PATH (geen `\bin`-suffix nodig op Windows; op de meeste systemen is dit `%AppData%\npm`).
    - Sluit PowerShell en open het opnieuw nadat je PATH hebt bijgewerkt.

    Gebruik voor desktopconfiguratie de native **Windows Hub**-app. Voor configuratie alleen via terminal
    worden zowel het PowerShell-installatieprogramma als de WSL2 Gateway-paden ondersteund.
    Docs: [Windows](/nl/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec-uitvoer toont verminkte Chinese tekst - wat moet ik doen?">
    Dit is meestal een mismatch in de consolecodepagina op native Windows-shells.

    Symptomen:

    - `system.run`/`exec`-uitvoer geeft Chinees weer als mojibake
    - Dezelfde opdracht ziet er goed uit in een ander terminalprofiel

    Snelle workaround in PowerShell:

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

    Als je dit nog steeds kunt reproduceren op de nieuwste OpenClaw, volg/rapporteer het dan in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="De docs hebben mijn vraag niet beantwoord - hoe krijg ik een beter antwoord?">
    Gebruik de **aanpasbare (git-)installatie** zodat je de volledige broncode en docs lokaal hebt, en vraag het daarna
    aan je bot (of Claude/Codex) _vanuit die map_, zodat die de repo kan lezen en precies kan antwoorden.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Meer details: [Installeren](/nl/install) en [Installer-vlaggen](/nl/install/installer).

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
    We hebben een **hostinghub** met de gangbare providers. Kies er een en volg de gids:

    - [VPS-hosting](/nl/vps) (alle providers op één plek)
    - [Fly.io](/nl/install/fly)
    - [Hetzner](/nl/install/hetzner)
    - [exe.dev](/nl/install/exe-dev)

    Hoe het in de cloud werkt: de **Gateway draait op de server**, en je benadert deze
    vanaf je laptop/telefoon via de Control UI (of Tailscale/SSH). Je status + workspace
    staan op de server, dus behandel de host als de bron van waarheid en maak er back-ups van.

    Je kunt **nodes** (Mac/iOS/Android/headless) koppelen aan die cloud-Gateway om toegang te krijgen tot
    lokaal scherm/camera/canvas of opdrachten op je laptop uit te voeren terwijl je de
    Gateway in de cloud houdt.

    Hub: [Platformen](/nl/platforms). Externe toegang: [Gateway op afstand](/nl/gateway/remote).
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

    Als je toch vanuit een agent moet automatiseren:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Bijwerken](/nl/cli/update), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Wat doet onboarding eigenlijk?">
    `openclaw onboard` is het aanbevolen configuratiepad. In **lokale modus** leidt het je door:

    - **Model-/auth-configuratie** (provider-OAuth, API-sleutels, Anthropic setup-token, plus opties voor lokale modellen zoals LM Studio)
    - **Workspace**-locatie + bootstrapbestanden
    - **Gateway-instellingen** (bind/port/auth/tailscale)
    - **Kanalen** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus gebundelde kanaal-plugins zoals QQ Bot)
    - **Daemon-installatie** (LaunchAgent op macOS; systemd-gebruikerseenheid op Linux/WSL2)
    - **Health checks** en selectie van **skills**

    Het waarschuwt ook als je geconfigureerde model onbekend is of auth ontbreekt.

  </Accordion>

  <Accordion title="Heb ik een Claude- of OpenAI-abonnement nodig om dit te draaien?">
    Nee. Je kunt OpenClaw uitvoeren met **API-sleutels** (Anthropic/OpenAI/anderen) of met
    **alleen-lokale modellen**, zodat je data op je apparaat blijft. Abonnementen (Claude
    Pro/Max of OpenAI Codex) zijn optionele manieren om je bij die providers te authenticeren.

    Voor Anthropic in OpenClaw is de praktische verdeling:

    - **Anthropic API-sleutel**: normale facturering via de Anthropic API
    - **Claude CLI / Claude-abonnementsauth in OpenClaw**: Anthropic-medewerkers
      hebben ons verteld dat dit gebruik weer is toegestaan, en OpenClaw behandelt `claude -p`-
      gebruik als goedgekeurd voor deze integratie, tenzij Anthropic een nieuw
      beleid publiceert

    Voor langlevende gateway-hosts blijven Anthropic API-sleutels nog steeds de meer
    voorspelbare configuratie. OpenAI Codex OAuth wordt expliciet ondersteund voor externe
    tools zoals OpenClaw.

    OpenClaw ondersteunt ook andere gehoste opties in abonnementsstijl, waaronder
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** en
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/nl/providers/anthropic), [OpenAI](/nl/providers/openai),
    [Qwen Cloud](/nl/providers/qwen),
    [MiniMax](/nl/providers/minimax), [Z.AI (GLM)](/nl/providers/zai),
    [Lokale modellen](/nl/gateway/local-models), [Modellen](/nl/concepts/models).

  </Accordion>

  <Accordion title="Kan ik een Claude Max-abonnement gebruiken zonder API-sleutel?">
    Ja.

    Anthropic-medewerkers hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl weer is toegestaan, dus
    OpenClaw behandelt Claude-abonnementsauth en `claude -p`-gebruik als goedgekeurd
    voor deze integratie, tenzij Anthropic een nieuw beleid publiceert. Als je
    de meest voorspelbare server-side configuratie wilt, gebruik dan in plaats daarvan een Anthropic API-sleutel.

  </Accordion>

  <Accordion title="Ondersteunen jullie Claude-abonnementsauth (Claude Pro of Max)?">
    Ja.

    Anthropic-medewerkers hebben ons verteld dat dit gebruik weer is toegestaan, dus OpenClaw behandelt
    Claude CLI-hergebruik en `claude -p`-gebruik als goedgekeurd voor deze integratie
    tenzij Anthropic een nieuw beleid publiceert.

    Anthropic setup-token is nog steeds beschikbaar als ondersteund tokenpad in OpenClaw, maar OpenClaw geeft nu de voorkeur aan Claude CLI-hergebruik en `claude -p` wanneer beschikbaar.
    Voor productie- of multi-user-workloads blijft Anthropic API-sleutelauth nog steeds de
    veiligere, voorspelbaardere keuze. Als je andere gehoste opties in abonnementsstijl
    in OpenClaw wilt, zie [OpenAI](/nl/providers/openai), [Qwen / Model
    Cloud](/nl/providers/qwen), [MiniMax](/nl/providers/minimax) en [GLM
    Models](/nl/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Waarom zie ik HTTP 429 rate_limit_error van Anthropic?">
    Dat betekent dat je **Anthropic-quota/rate limit** voor het huidige venster is uitgeput. Als je
    **Claude CLI** gebruikt, wacht dan tot het venster wordt gereset of upgrade je plan. Als je
    een **Anthropic API-sleutel** gebruikt, controleer dan de Anthropic Console
    voor gebruik/facturering en verhoog de limieten indien nodig.

    Als het bericht specifiek is:
    `Extra usage is required for long context requests`, dan probeert het verzoek
    Anthropic's 1M-contextvenster te gebruiken (een GA-geschikt 1M Claude 4.x-model of verouderde
    `context1m: true`-configuratie). Dat werkt alleen wanneer je referentie in aanmerking komt
    voor facturering voor lange context (API-sleutelfacturering of het OpenClaw Claude-loginpad
    met Extra Usage ingeschakeld).

    Tip: stel een **fallbackmodel** in zodat OpenClaw kan blijven antwoorden terwijl een provider rate-limited is.
    Zie [Modellen](/nl/cli/models), [OAuth](/nl/concepts/oauth), en
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/nl/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wordt AWS Bedrock ondersteund?">
    Ja. OpenClaw heeft een gebundelde **Amazon Bedrock (Converse)**-provider. Wanneer AWS-env-markeringen aanwezig zijn, kan OpenClaw de streaming/tekst-Bedrock-catalogus automatisch ontdekken en samenvoegen als een impliciete `amazon-bedrock`-provider; anders kun je `plugins.entries.amazon-bedrock.config.discovery.enabled` expliciet inschakelen of een handmatige providervermelding toevoegen. Zie [Amazon Bedrock](/nl/providers/bedrock) en [Modelproviders](/nl/providers/models). Als je een beheerde sleutelstroom wilt, blijft een OpenAI-compatibele proxy vóór Bedrock een geldige optie.
  </Accordion>

  <Accordion title="Hoe werkt Codex-authenticatie?">
    OpenClaw ondersteunt **OpenAI Code (Codex)** via OAuth (inloggen met ChatGPT). Gebruik
    `openai/gpt-5.5` voor de gebruikelijke setup: ChatGPT/Codex-abonnementsauthenticatie plus
    native Codex-appserveruitvoering. Verouderde Codex GPT-verwijzingen zijn
    verouderde configuratie die wordt gerepareerd door `openclaw doctor --fix`. Directe OpenAI API-sleuteltoegang
    blijft beschikbaar voor niet-agent OpenAI API-oppervlakken en voor agentmodellen
    via een geordend `openai` API-sleutelprofiel.
    Zie [Modelproviders](/nl/concepts/model-providers) en [Onboarding (CLI)](/nl/start/wizard).
  </Accordion>

  <Accordion title="Waarom vermeldt OpenClaw nog steeds het verouderde OpenAI Codex-voorvoegsel?">
    `openai` is de provider- en auth-profiel-id voor zowel OpenAI API-sleutels als
    ChatGPT/Codex OAuth. Je kunt het verouderde OpenAI Codex-voorvoegsel nog steeds zien in verouderde configuratie en
    migratiewaarschuwingen.
    Oudere configuraties gebruikten het ook als modelvoorvoegsel:

    - `openai/gpt-5.5` = ChatGPT/Codex-abonnementsauthenticatie met native Codex-runtime voor agentbeurten
    - verouderde Codex GPT-5.5-verwijzing = verouderde modelroute gerepareerd door `openclaw doctor --fix`
    - `openai/gpt-5.5` plus een geordend `openai` API-sleutelprofiel = API-sleutelauthenticatie voor een OpenAI-agentmodel
    - verouderde Codex-auth-profiel-id's = verouderde auth-profiel-id gemigreerd door `openclaw doctor --fix`

    Als je het directe OpenAI Platform-facturerings/limietpad wilt, stel dan
    `OPENAI_API_KEY` in. Als je ChatGPT/Codex-abonnementsauthenticatie wilt, log dan in met
    `openclaw models auth login --provider openai`. Houd de modelverwijzing als
    `openai/gpt-5.5`; verouderde Codex-modelverwijzingen zijn verouderde configuratie die
    `openclaw doctor --fix` herschrijft.

  </Accordion>

  <Accordion title="Waarom kunnen Codex OAuth-limieten verschillen van ChatGPT web?">
    Codex OAuth gebruikt door OpenAI beheerde, planafhankelijke quotavensters. In de praktijk
    kunnen die limieten verschillen van de ChatGPT-website/app-ervaring, zelfs wanneer
    beide aan hetzelfde account zijn gekoppeld.

    OpenClaw kan de momenteel zichtbare providergebruiks/quotavensters tonen in
    `openclaw models status`, maar het verzint of normaliseert geen ChatGPT-web
    rechten naar directe API-toegang. Als je het directe OpenAI Platform
    facturerings/limietpad wilt, gebruik dan `openai/*` met een API-sleutel.

  </Accordion>

  <Accordion title="Ondersteunen jullie OpenAI-abonnementsauthenticatie (Codex OAuth)?">
    Ja. OpenClaw ondersteunt **OpenAI Code (Codex)-abonnements-OAuth** volledig.
    OpenAI staat abonnements-OAuth-gebruik expliciet toe in externe tools/workflows
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
    3. Log in: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standaardmodel na inloggen: `google-gemini-cli/gemini-3-flash-preview`
    5. Als verzoeken mislukken, stel `GOOGLE_CLOUD_PROJECT` of `GOOGLE_CLOUD_PROJECT_ID` in op de Gateway-host

    Dit slaat OAuth-tokens op in auth-profielen op de Gateway-host. Details: [Modelproviders](/nl/concepts/model-providers).

  </Accordion>

  <Accordion title="Is een lokaal model geschikt voor informele chats?">
    Meestal niet. OpenClaw heeft grote context + sterke veiligheid nodig; kleine kaarten kappen af en lekken. Als het moet, draai dan de **grootste** modelbuild die je lokaal kunt draaien (LM Studio) en zie [/gateway/local-models](/nl/gateway/local-models). Kleinere/gequantiseerde modellen vergroten het risico op prompt-injectie - zie [Beveiliging](/nl/gateway/security).
  </Accordion>

  <Accordion title="Hoe houd ik verkeer van gehoste modellen in een specifieke regio?">
    Kies regio-gebonden endpoints. OpenRouter biedt in de VS gehoste opties voor MiniMax, Kimi en GLM; kies de in de VS gehoste variant om data in de regio te houden. Je kunt Anthropic/OpenAI daarnaast nog steeds vermelden door `models.mode: "merge"` te gebruiken, zodat fallbacks beschikbaar blijven terwijl de geregionaliseerde provider die je selecteert wordt gerespecteerd.
  </Accordion>

  <Accordion title="Moet ik een Mac Mini kopen om dit te installeren?">
    Nee. OpenClaw draait op macOS of Linux (Windows via WSL2). Een Mac mini is optioneel - sommige mensen
    kopen er een als altijd-aan-host, maar een kleine VPS, thuisserver of Raspberry Pi-klasse machine werkt ook.

    Je hebt alleen een Mac nodig **voor tools die alleen op macOS werken**. Gebruik voor iMessage [iMessage](/nl/channels/imessage) met `imsg` op elke Mac die is ingelogd bij Berichten. Als de Gateway op Linux of elders draait, stel dan `channels.imessage.cliPath` in op een SSH-wrapper die `imsg` op die Mac uitvoert. Als je andere macOS-only tools wilt, draai de Gateway dan op een Mac of koppel een macOS-Node.

    Docs: [iMessage](/nl/channels/imessage), [Nodes](/nl/nodes), [Mac remote mode](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Heb ik een Mac mini nodig voor iMessage-ondersteuning?">
    Je hebt **een macOS-apparaat** nodig dat is ingelogd bij Berichten. Dat hoeft **geen** Mac mini te zijn -
    elke Mac werkt. **Gebruik [iMessage](/nl/channels/imessage)** met `imsg`; de Gateway kan op die Mac draaien, of elders met een SSH-wrapper `cliPath`.

    Veelvoorkomende setups:

    - Draai de Gateway op Linux/VPS en stel `channels.imessage.cliPath` in op een SSH-wrapper die `imsg` uitvoert op een Mac die is ingelogd bij Berichten.
    - Draai alles op de Mac als je de eenvoudigste setup op één machine wilt.

    Docs: [iMessage](/nl/channels/imessage), [Nodes](/nl/nodes),
    [Mac remote mode](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Als ik een Mac mini koop om OpenClaw te draaien, kan ik die verbinden met mijn MacBook Pro?">
    Ja. De **Mac mini kan de Gateway draaien**, en je MacBook Pro kan verbinden als een
    **Node** (companion-apparaat). Nodes draaien de Gateway niet - ze leveren extra
    mogelijkheden zoals scherm/camera/canvas en `system.run` op dat apparaat.

    Veelvoorkomend patroon:

    - Gateway op de Mac mini (altijd aan).
    - MacBook Pro draait de macOS-app of een Node-host en koppelt met de Gateway.
    - Gebruik `openclaw nodes status` / `openclaw nodes list` om hem te zien.

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

    Setup vraagt alleen om numerieke gebruikers-ID's. Als je al verouderde `@username`-vermeldingen in configuratie hebt, kan `openclaw doctor --fix` proberen ze op te lossen.

    Veiliger (geen externe bot):

    - DM je bot, voer daarna `openclaw logs --follow` uit en lees `from.id`.

    Officiële Bot API:

    - DM je bot, roep daarna `https://api.telegram.org/bot<bot_token>/getUpdates` aan en lees `message.from.id`.

    Externe partij (minder privé):

    - DM `@userinfobot` of `@getidsbot`.

    Zie [/channels/telegram](/nl/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Kunnen meerdere mensen één WhatsApp-nummer gebruiken met verschillende OpenClaw-instanties?">
    Ja, via **multi-agentrouting**. Bind de WhatsApp-**DM** van elke afzender (peer `kind: "direct"`, afzender E.164 zoals `+15551234567`) aan een andere `agentId`, zodat elke persoon zijn eigen workspace en sessieopslag krijgt. Antwoorden komen nog steeds van hetzelfde **WhatsApp-account**, en DM-toegangscontrole (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) is globaal per WhatsApp-account. Zie [Multi-Agent Routing](/nl/concepts/multi-agent) en [WhatsApp](/nl/channels/whatsapp).
  </Accordion>

  <Accordion title='Kan ik een "snelle chat"-agent en een "Opus voor coderen"-agent draaien?'>
    Ja. Gebruik multi-agentrouting: geef elke agent zijn eigen standaardmodel en bind vervolgens inkomende routes (provideraccount of specifieke peers) aan elke agent. Voorbeeldconfiguratie staat in [Multi-Agent Routing](/nl/concepts/multi-agent). Zie ook [Modellen](/nl/concepts/models) en [Configuratie](/nl/gateway/configuration).
  </Accordion>

  <Accordion title="Werkt Homebrew op Linux?">
    Ja. Homebrew ondersteunt Linux (Linuxbrew). Snelle setup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Als je OpenClaw via systemd draait, zorg er dan voor dat de service-PATH `/home/linuxbrew/.linuxbrew/bin` (of je brew-prefix) bevat, zodat met `brew` geïnstalleerde tools worden gevonden in niet-login shells.
    Recente builds voegen ook veelvoorkomende gebruikers-binmappen vooraan toe op Linux systemd-services (bijvoorbeeld `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) en respecteren `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` en `FNM_DIR` wanneer ze zijn ingesteld.

  </Accordion>

  <Accordion title="Verschil tussen de hackbare git-installatie en npm-installatie">
    - **Hackbare (git)-installatie:** volledige source-checkout, bewerkbaar, het beste voor contributors.
      Je draait builds lokaal en kunt code/docs patchen.
    - **npm-installatie:** globale CLI-installatie, geen repo, het beste voor "gewoon draaien."
      Updates komen van npm dist-tags.

    Docs: [Aan de slag](/nl/start/getting-started), [Bijwerken](/nl/install/updating).

  </Accordion>

  <Accordion title="Kan ik later wisselen tussen npm- en git-installaties?">
    Ja. Gebruik `openclaw update --channel ...` wanneer OpenClaw al is geïnstalleerd.
    Dit **verwijdert je data niet** - het verandert alleen de OpenClaw-code-installatie.
    Je state (`~/.openclaw`) en workspace (`~/.openclaw/workspace`) blijven onaangeroerd.

    Van npm naar git:

    ```bash
    openclaw update --channel dev
    ```

    Van git naar npm:

    ```bash
    openclaw update --channel stable
    ```

    Voeg `--dry-run` toe om eerst de geplande moduswissel te bekijken. De updater voert
    Doctor-vervolgstappen uit, ververst Plugin-bronnen voor het doelkanaal, en
    herstart de Gateway tenzij je `--no-restart` meegeeft.

    De installer kan beide modi ook afdwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Back-uptips: zie [Back-upstrategie](/nl/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Moet ik de Gateway op mijn laptop of op een VPS draaien?">
    Kort antwoord: **als je 24/7 betrouwbaarheid wilt, gebruik dan een VPS**. Als je
    zo min mogelijk frictie wilt en slaapstand/herstarts prima vindt, draai hem dan lokaal.

    **Laptop (lokale Gateway)**

    - **Voordelen:** geen serverkosten, directe toegang tot lokale bestanden, live browservenster.
    - **Nadelen:** slaapstand/netwerkuitval = verbroken verbindingen, OS-updates/herstarts onderbreken, moet wakker blijven.

    **VPS / cloud**

    - **Voordelen:** altijd aan, stabiel netwerk, geen problemen met laptop-slaapstand, makkelijker draaiend te houden.
    - **Nadelen:** draait vaak headless (gebruik screenshots), alleen externe bestandstoegang, je moet SSH gebruiken voor updates.

    **OpenClaw-specifieke opmerking:** WhatsApp/Telegram/Slack/Mattermost/Discord werken allemaal prima vanaf een VPS. De enige echte afweging is **headless browser** versus een zichtbaar venster. Zie [Browser](/nl/tools/browser).

    **Aanbevolen standaard:** VPS als je eerder verbroken Gateway-verbindingen had. Lokaal is ideaal wanneer je de Mac actief gebruikt en lokale bestandstoegang of UI-automatisering met een zichtbare browser wilt.

  </Accordion>

  <Accordion title="Hoe belangrijk is het om OpenClaw op een dedicated machine te draaien?">
    Niet vereist, maar **aanbevolen voor betrouwbaarheid en isolatie**.

    - **Dedicated host (VPS/Mac mini/Raspberry Pi):** altijd aan, minder onderbrekingen door slaapstand/herstart, schonere machtigingen, makkelijker draaiend te houden.
    - **Gedeelde laptop/desktop:** helemaal prima voor testen en actief gebruik, maar verwacht pauzes wanneer de machine in slaapstand gaat of updates uitvoert.

    Als je het beste van beide werelden wilt, houd de Gateway dan op een dedicated host en koppel je laptop als een **node** voor lokale scherm-/camera-/exec-tools. Zie [Nodes](/nl/nodes).
    Lees [Beveiliging](/nl/gateway/security) voor beveiligingsadvies.

  </Accordion>

  <Accordion title="Wat zijn de minimale VPS-vereisten en het aanbevolen OS?">
    OpenClaw is lichtgewicht. Voor een basis-Gateway + één chatkanaal:

    - **Absoluut minimum:** 1 vCPU, 1GB RAM, ~500MB schijf.
    - **Aanbevolen:** 1-2 vCPU, 2GB RAM of meer voor extra ruimte (logs, media, meerdere kanalen). Node-tools en browserautomatisering kunnen veel resources gebruiken.

    OS: gebruik **Ubuntu LTS** (of een moderne Debian/Ubuntu). Het Linux-installatiepad is daar het best getest.

    Docs: [Linux](/nl/platforms/linux), [VPS-hosting](/nl/vps).

  </Accordion>

  <Accordion title="Kan ik OpenClaw in een VM draaien en wat zijn de vereisten?">
    Ja. Behandel een VM hetzelfde als een VPS: hij moet altijd aan staan, bereikbaar zijn en genoeg
    RAM hebben voor de Gateway en alle kanalen die je inschakelt.

    Basisrichtlijnen:

    - **Absoluut minimum:** 1 vCPU, 1GB RAM.
    - **Aanbevolen:** 2GB RAM of meer als je meerdere kanalen, browserautomatisering of mediatools draait.
    - **OS:** Ubuntu LTS of een andere moderne Debian/Ubuntu.

    Als je Windows gebruikt, gebruik dan **Windows Hub** voor desktopinstallatie, of WSL2 wanneer
    je specifiek een Linux-achtige Gateway-VM wilt met brede compatibiliteit
    met tooling. Zie [Windows](/nl/platforms/windows), [VPS-hosting](/nl/vps).
    Als je macOS in een VM draait, zie [macOS-VM](/nl/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [FAQ](/nl/help/faq) — de hoofd-FAQ (modellen, sessies, gateway, beveiliging, meer)
- [Installatieoverzicht](/nl/install)
- [Aan de slag](/nl/start/getting-started)
- [Probleemoplossing](/nl/help/troubleshooting)
