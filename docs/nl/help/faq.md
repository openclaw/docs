---
read_when:
    - Veelvoorkomende vragen over configuratie, installatie, onboarding of runtime-ondersteuning beantwoorden
    - Gebruikersgemelde problemen triëren vóór diepere debugging
summary: Veelgestelde vragen over de installatie, configuratie en het gebruik van OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-06-27T17:40:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Snelle antwoorden plus diepere probleemoplossing voor praktijksituaties (lokale ontwikkeling, VPS, multi-agent, OAuth/API-sleutels, model-failover). Zie [Probleemoplossing](/nl/gateway/troubleshooting) voor runtime-diagnostiek. Zie [Configuratie](/nl/gateway/configuration) voor de volledige configuratiereferentie.

## Eerste 60 seconden als er iets kapot is

1. **Snelle status (eerste controle)**

   ```bash
   openclaw status
   ```

   Snelle lokale samenvatting: OS + update, bereikbaarheid van gateway/service, agents/sessies, providerconfiguratie + runtimeproblemen (wanneer de gateway bereikbaar is).

2. **Plakbaar rapport (veilig om te delen)**

   ```bash
   openclaw status --all
   ```

   Alleen-lezen diagnose met log-tail (tokens geredigeerd).

3. **Daemon- + poortstatus**

   ```bash
   openclaw gateway status
   ```

   Toont supervisor-runtime versus RPC-bereikbaarheid, de doel-URL van de probe en welke configuratie de service waarschijnlijk gebruikte.

4. **Diepe probes**

   ```bash
   openclaw status --deep
   ```

   Voert een live Gateway-gezondheidsprobe uit, inclusief kanaalprobes wanneer ondersteund
   (vereist een bereikbare Gateway). Zie [Gezondheid](/nl/gateway/health).

5. **Tail de nieuwste log**

   ```bash
   openclaw logs --follow
   ```

   Als RPC niet beschikbaar is, val dan terug op:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Bestandslogs staan los van servicelogs; zie [Logging](/nl/logging) en [Probleemoplossing](/nl/gateway/troubleshooting).

6. **Voer de doctor uit (reparaties)**

   ```bash
   openclaw doctor
   ```

   Repareert/migreert configuratie/status + voert gezondheidscontroles uit. Zie [Doctor](/nl/gateway/doctor).

7. **Gateway-snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Vraagt de draaiende Gateway om een volledige snapshot (alleen WS). Zie [Gezondheid](/nl/gateway/health).

## Snel starten en eerste installatie

Q&A voor de eerste keer — installatie, onboarding, auth-routes, abonnementen, eerste fouten —
staat in de [FAQ eerste gebruik](/nl/help/faq-first-run).

## Wat is OpenClaw?

<AccordionGroup>
  <Accordion title="Wat is OpenClaw, in één alinea?">
    OpenClaw is een persoonlijke AI-assistent die je op je eigen apparaten draait. Hij antwoordt op de berichtendiensten die je al gebruikt (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat en gebundelde kanaalplugins zoals QQ Bot) en kan ook spraak + een live Canvas doen op ondersteunde platforms. De **Gateway** is het altijd actieve besturingsvlak; de assistent is het product.
  </Accordion>

  <Accordion title="Waardepropositie">
    OpenClaw is niet "gewoon een Claude-wrapper." Het is een **local-first besturingsvlak** waarmee je een
    capabele assistent op **je eigen hardware** draait, bereikbaar vanuit de chat-apps die je al gebruikt, met
    stateful sessies, geheugen en tools - zonder de controle over je workflows over te dragen aan een gehoste
    SaaS.

    Hoogtepunten:

    - **Jouw apparaten, jouw data:** draai de Gateway waar je wilt (Mac, Linux, VPS) en houd de
      workspace + sessiegeschiedenis lokaal.
    - **Echte kanalen, geen web-sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus mobiele spraak en Canvas op ondersteunde platforms.
    - **Model-agnostisch:** gebruik Anthropic, OpenAI, MiniMax, OpenRouter, enz., met routering
      per agent en failover.
    - **Alleen-lokaal optie:** draai lokale modellen zodat **alle data op je apparaat kan blijven** als je dat wilt.
    - **Multi-agentroutering:** afzonderlijke agents per kanaal, account of taak, elk met een eigen
      workspace en standaardinstellingen.
    - **Open source en hackbaar:** inspecteer, breid uit en host zelf zonder vendor lock-in.

    Docs: [Gateway](/nl/gateway), [Kanalen](/nl/channels), [Multi-agent](/nl/concepts/multi-agent),
    [Geheugen](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Ik heb het net ingesteld - wat moet ik eerst doen?">
    Goede eerste projecten:

    - Bouw een website (WordPress, Shopify of een eenvoudige statische site).
    - Maak een prototype van een mobiele app (outline, schermen, API-plan).
    - Organiseer bestanden en mappen (opschonen, naamgeving, tagging).
    - Verbind Gmail en automatiseer samenvattingen of opvolgingen.

    Het kan grote taken aan, maar werkt het best wanneer je ze in fasen opsplitst en
    subagenten gebruikt voor parallel werk.

  </Accordion>

  <Accordion title="Wat zijn de vijf belangrijkste dagelijkse use-cases voor OpenClaw?">
    Dagelijkse winst ziet er meestal zo uit:

    - **Persoonlijke briefings:** samenvattingen van inbox, agenda en nieuws dat jij belangrijk vindt.
    - **Onderzoek en opstellen:** snel onderzoek, samenvattingen en eerste concepten voor e-mails of docs.
    - **Herinneringen en opvolgingen:** door Cron of Heartbeat gedreven duwtjes en checklists.
    - **Browserautomatisering:** formulieren invullen, data verzamelen en webtaken herhalen.
    - **Coördinatie tussen apparaten:** stuur een taak vanaf je telefoon, laat de Gateway die op een server uitvoeren en krijg het resultaat terug in chat.

  </Accordion>

  <Accordion title="Kan OpenClaw helpen met leadgeneratie, outreach, advertenties en blogs voor een SaaS?">
    Ja, voor **onderzoek, kwalificatie en opstellen**. Het kan sites scannen, shortlists maken,
    prospects samenvatten en concepten schrijven voor outreach of advertentieteksten.

    Houd bij **outreach of advertentieruns** een mens in de loop. Vermijd spam, volg lokale wetgeving en
    platformbeleid, en controleer alles voordat het wordt verzonden. Het veiligste patroon is dat
    OpenClaw opstelt en jij goedkeurt.

    Docs: [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Wat zijn de voordelen ten opzichte van Claude Code voor webontwikkeling?">
    OpenClaw is een **persoonlijke assistent** en coördinatielaag, geen vervanging voor een IDE. Gebruik
    Claude Code of Codex voor de snelste directe codeerlus binnen een repo. Gebruik OpenClaw wanneer je
    duurzaam geheugen, toegang vanaf meerdere apparaten en toolorkestratie wilt.

    Voordelen:

    - **Persistent geheugen + workspace** over sessies heen
    - **Toegang via meerdere platforms** (WhatsApp, Telegram, TUI, WebChat)
    - **Toolorkestratie** (browser, bestanden, planning, hooks)
    - **Altijd actieve Gateway** (draai op een VPS, communiceer vanaf overal)
    - **Nodes** voor lokale browser/scherm/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills en automatisering

<AccordionGroup>
  <Accordion title="Hoe pas ik Skills aan zonder de repo vuil te houden?">
    Gebruik beheerde overrides in plaats van de repo-kopie te bewerken. Zet je wijzigingen in `~/.openclaw/skills/<name>/SKILL.md` (of voeg een map toe via `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). De prioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebundeld → `skills.load.extraDirs`, dus beheerde overrides winnen nog steeds van gebundelde Skills zonder git aan te raken. Als je de skill globaal geïnstalleerd nodig hebt maar alleen zichtbaar voor sommige agents, bewaar de gedeelde kopie in `~/.openclaw/skills` en regel de zichtbaarheid met `agents.defaults.skills` en `agents.list[].skills`. Alleen edits die upstream waard zijn, horen in de repo te staan en als PR's uit te gaan.
  </Accordion>

  <Accordion title="Kan ik Skills laden vanuit een aangepaste map?">
    Ja. Voeg extra mappen toe via `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (laagste prioriteit). De standaardprioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebundeld → `skills.load.extraDirs`. `clawhub` installeert standaard in `./skills`, wat OpenClaw in de volgende sessie behandelt als `<workspace>/skills`. Als de skill alleen zichtbaar moet zijn voor bepaalde agents, combineer dat dan met `agents.defaults.skills` of `agents.list[].skills`.
  </Accordion>

  <Accordion title="Hoe kan ik verschillende modellen of instellingen gebruiken voor verschillende taken?">
    Vandaag zijn dit de ondersteunde patronen:

    - **Cron-taken**: geïsoleerde taken kunnen per taak een `model`-override instellen.
    - **Agents**: routeer taken naar afzonderlijke agents met verschillende standaardmodellen, denkniveaus en streamparameters.
    - **Schakelen op aanvraag**: gebruik `/model` om op elk moment van model te wisselen voor de huidige sessie.

    Gebruik bijvoorbeeld hetzelfde model met verschillende instellingen per agent:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Zet gedeelde standaarden per model in `agents.defaults.models["provider/model"].params` en zet agentspecifieke overrides daarna in platte `agents.list[].params`. Definieer geen afzonderlijke geneste `agents.list[].models["provider/model"].params`-items voor hetzelfde model; `agents.list[].models` is bedoeld voor modelcatalogus en runtime-overrides per agent.

    Zie [Cron-taken](/nl/automation/cron-jobs), [Multi-agentroutering](/nl/concepts/multi-agent), [Configuratie](/nl/gateway/config-agents) en [Slash-opdrachten](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="De bot bevriest tijdens zwaar werk. Hoe laad ik dat uit?">
    Gebruik **subagenten** voor lange of parallelle taken. Subagenten draaien in hun eigen sessie,
    geven een samenvatting terug en houden je hoofdchat responsief.

    Vraag je bot om "spawn a sub-agent for this task" of gebruik `/subagents`.
    Gebruik `/status` in chat om te zien wat de Gateway nu doet (en of hij bezig is).

    Tokentip: lange taken en subagenten verbruiken allebei tokens. Als kosten een zorg zijn, stel dan een
    goedkoper model in voor subagenten via `agents.defaults.subagents.model`.

    Docs: [Subagenten](/nl/tools/subagents), [Achtergrondtaken](/nl/automation/tasks).

  </Accordion>

  <Accordion title="Hoe werken thread-gebonden subagentsessies op Discord?">
    Gebruik threadbindingen. Je kunt een Discord-thread binden aan een subagent of sessiedoel, zodat opvolgberichten in die thread op die gebonden sessie blijven.

    Basisflow:

    - Spawn met `sessions_spawn` met `thread: true` (en optioneel `mode: "session"` voor persistente opvolging).
    - Of bind handmatig met `/focus <target>`.
    - Gebruik `/agents` om de bindingsstatus te inspecteren.
    - Gebruik `/session idle <duration|off>` en `/session max-age <duration|off>` om automatisch ontfocussen te regelen.
    - Gebruik `/unfocus` om de thread los te koppelen.

    Vereiste configuratie:

    - Globale standaarden: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisch binden bij spawn: `channels.discord.threadBindings.spawnSessions` staat standaard op `true`; zet dit op `false` om thread-gebonden sessiespawns uit te schakelen.

    Docs: [Subagenten](/nl/tools/subagents), [Discord](/nl/channels/discord), [Configuratiereferentie](/nl/gateway/configuration-reference), [Slash-opdrachten](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Een subagent is klaar, maar de voltooiingsupdate ging naar de verkeerde plek of werd nooit geplaatst. Wat moet ik controleren?">
    Controleer eerst de opgeloste route van de aanvrager:

    - Bezorging van subagenten in voltooiingsmodus geeft de voorkeur aan een gebonden thread- of gespreksroute wanneer die bestaat.
    - Als de voltooiingsoorsprong alleen een kanaal bevat, valt OpenClaw terug op de opgeslagen route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe bezorging nog steeds kan slagen.
    - Als er geen gebonden route en ook geen bruikbare opgeslagen route bestaat, kan directe bezorging mislukken en valt het resultaat terug op bezorging via de sessiewachtrij in plaats van onmiddellijk in chat te plaatsen.
    - Ongeldige of verouderde doelen kunnen nog steeds wachtrij-fallback of uiteindelijk falen van bezorging afdwingen.
    - Als het laatste zichtbare assistentantwoord van het child exact het stille token `NO_REPLY` / `no_reply` is, of exact `ANNOUNCE_SKIP`, onderdrukt OpenClaw bewust de aankondiging in plaats van oudere voortgang te plaatsen.
    - Tool-/toolResult-uitvoer wordt niet gepromoveerd tot resulttekst van het child; het resultaat is het nieuwste zichtbare assistentantwoord van het child.

    Debuggen:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Subagenten](/nl/tools/subagents), [Achtergrondtaken](/nl/automation/tasks), [Sessietools](/nl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron of herinneringen worden niet uitgevoerd. Wat moet ik controleren?">
    Cron draait binnen het Gateway-proces. Als de Gateway niet continu actief is,
    worden geplande taken niet uitgevoerd.

    Checklist:

    - Bevestig dat cron is ingeschakeld (`cron.enabled`) en dat `OPENCLAW_SKIP_CRON` niet is ingesteld.
    - Controleer of de Gateway 24/7 draait (geen slaapstand/herstarts).
    - Verifieer de tijdzone-instellingen voor de taak (`--tz` versus de tijdzone van de host).

    Debuggen:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron-taken](/nl/automation/cron-jobs), [Automatisering](/nl/automation).

  </Accordion>

  <Accordion title="Cron is uitgevoerd, maar er is niets naar het kanaal verzonden. Waarom?">
    Controleer eerst de bezorgmodus:

    - `--no-deliver` / `delivery.mode: "none"` betekent dat er geen fallback-verzending door de runner wordt verwacht.
    - Een ontbrekend of ongeldig aankondigingsdoel (`channel` / `to`) betekent dat de runner uitgaande bezorging heeft overgeslagen.
    - Kanaalautorisatiefouten (`unauthorized`, `Forbidden`) betekenen dat de runner probeerde te bezorgen, maar dat referenties dit blokkeerden.
    - Een stil geïsoleerd resultaat (alleen `NO_REPLY` / `no_reply`) wordt behandeld als opzettelijk niet-bezorgbaar, waardoor de runner ook bezorging via de wachtrij-fallback onderdrukt.

    Voor geïsoleerde cron-taken kan de agent nog steeds rechtstreeks verzenden met de `message`-
    tool wanneer er een chatroute beschikbaar is. `--announce` bepaalt alleen het runner-
    fallbackpad voor definitieve tekst die de agent niet al heeft verzonden.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Cron-taken](/nl/automation/cron-jobs), [Achtergrondtaken](/nl/automation/tasks).

  </Accordion>

  <Accordion title="Waarom wisselde een geïsoleerde cron-run van model of probeerde die het één keer opnieuw?">
    Dat is meestal het live modelwisselpad, geen dubbele planning.

    Geïsoleerde Cron kan een runtime-modeloverdracht persistent maken en opnieuw proberen wanneer de actieve
    run `LiveSessionModelSwitchError` gooit. De nieuwe poging behoudt de gewisselde
    provider/model, en als de wissel een nieuwe auth-profieloverride bevatte, maakt Cron
    die ook persistent voordat opnieuw wordt geprobeerd.

    Gerelateerde selectieregels:

    - Gmail-hookmodeloverride wint eerst wanneer van toepassing.
    - Daarna `model` per taak.
    - Daarna een opgeslagen cron-sessiemodeloverride.
    - Daarna de normale modelselectie van agent/standaard.

    De retrylus is begrensd. Na de eerste poging plus 2 wissel-retries
    breekt Cron af in plaats van eindeloos te blijven lussen.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Cron-taken](/nl/automation/cron-jobs), [cron CLI](/nl/cli/cron).

  </Accordion>

  <Accordion title="Hoe installeer ik Skills op Linux?">
    Gebruik native `openclaw skills`-commando's of plaats Skills in je werkruimte. De macOS Skills-UI is niet beschikbaar op Linux.
    Blader door Skills op [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    Native `openclaw skills install` schrijft standaard naar de actieve werkruimte-map `skills/`.
    Voeg `--global` toe om te installeren in de gedeelde beheerde
    Skills-map voor alle lokale agents. Installeer de afzonderlijke `clawhub` CLI
    alleen als je je eigen Skills wilt publiceren of synchroniseren. Gebruik
    `agents.defaults.skills` of `agents.list[].skills` als je wilt beperken
    welke agents gedeelde Skills kunnen zien.

  </Accordion>

  <Accordion title="Kan OpenClaw taken volgens een schema of continu op de achtergrond uitvoeren?">
    Ja. Gebruik de Gateway-planner:

    - **Cron-taken** voor geplande of terugkerende taken (blijven behouden na herstarts).
    - **Heartbeat** voor periodieke controles van de "hoofdsessie".
    - **Geïsoleerde taken** voor autonome agents die samenvattingen plaatsen of aan chats leveren.

    Docs: [Cron-taken](/nl/automation/cron-jobs), [Automatisering](/nl/automation),
    [Heartbeat](/nl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kan ik Apple macOS-only Skills vanaf Linux uitvoeren?">
    Niet rechtstreeks. macOS Skills worden afgeschermd door `metadata.openclaw.os` plus vereiste binaries, en Skills verschijnen alleen in de systeemprompt wanneer ze geschikt zijn op de **Gateway-host**. Op Linux worden alleen-`darwin` Skills (zoals `apple-notes`, `apple-reminders`, `things-mac`) niet geladen tenzij je de afscherming overschrijft.

    Je hebt drie ondersteunde patronen:

    **Optie A - voer de Gateway uit op een Mac (het eenvoudigst).**
    Voer de Gateway uit waar de macOS-binaries bestaan en maak vervolgens verbinding vanaf Linux in [remote-modus](#gateway-ports-already-running-and-remote-mode) of via Tailscale. De Skills laden normaal omdat de Gateway-host macOS is.

    **Optie B - gebruik een macOS-Node (geen SSH).**
    Voer de Gateway uit op Linux, koppel een macOS-Node (menubalkapp) en stel **Node-uitvoercommando's** op de Mac in op "Altijd vragen" of "Altijd toestaan". OpenClaw kan macOS-only Skills als geschikt behandelen wanneer de vereiste binaries op de Node bestaan. De agent voert die Skills uit via de `nodes`-tool. Als je "Altijd vragen" kiest, voegt goedkeuren van "Altijd toestaan" in de prompt dat commando toe aan de allowlist.

    **Optie C - proxy macOS-binaries via SSH (geavanceerd).**
    Houd de Gateway op Linux, maar zorg dat de vereiste CLI-binaries worden omgezet naar SSH-wrappers die op een Mac draaien. Overschrijf daarna de Skill om Linux toe te staan, zodat die geschikt blijft.

    1. Maak een SSH-wrapper voor de binary (voorbeeld: `memo` voor Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Zet de wrapper op `PATH` op de Linux-host (bijvoorbeeld `~/bin/memo`).
    3. Overschrijf de Skill-metadata (werkruimte of `~/.openclaw/skills`) om Linux toe te staan:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Start een nieuwe sessie zodat de Skills-snapshot wordt vernieuwd.

  </Accordion>

  <Accordion title="Hebben jullie een Notion- of HeyGen-integratie?">
    Niet ingebouwd op dit moment.

    Opties:

    - **Aangepaste Skill / Plugin:** het beste voor betrouwbare API-toegang (Notion/HeyGen hebben beide API's).
    - **Browserautomatisering:** werkt zonder code, maar is trager en kwetsbaarder.

    Als je context per klant wilt behouden (agency-workflows), is een eenvoudig patroon:

    - Eén Notion-pagina per klant (context + voorkeuren + actief werk).
    - Vraag de agent om die pagina aan het begin van een sessie op te halen.

    Als je een native integratie wilt, open dan een feature request of bouw een Skill
    gericht op die API's.

    Skills installeren:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Native installaties komen terecht in de actieve werkruimte-map `skills/`. Gebruik voor gedeelde Skills voor alle lokale agents `openclaw skills install @owner/<skill-slug> --global` (of plaats ze handmatig in `~/.openclaw/skills/<name>/SKILL.md`). Als slechts enkele agents een gedeelde installatie mogen zien, configureer dan `agents.defaults.skills` of `agents.list[].skills`. Sommige Skills verwachten binaries die via Homebrew zijn geïnstalleerd; op Linux betekent dat Linuxbrew (zie de Homebrew Linux FAQ-vermelding hierboven). Zie [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config) en [ClawHub](/nl/clawhub).

  </Accordion>

  <Accordion title="Hoe gebruik ik mijn bestaande ingelogde Chrome met OpenClaw?">
    Gebruik het ingebouwde `user`-browserprofiel, dat verbinding maakt via Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Als je een aangepaste naam wilt, maak dan een expliciet MCP-profiel:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dit pad kan de lokale hostbrowser of een verbonden browser-Node gebruiken. Als de Gateway ergens anders draait, voer dan een Node-host uit op de browsermachine of gebruik remote CDP.

    Huidige beperkingen voor `existing-session` / `user`:

    - acties zijn ref-gestuurd, niet CSS-selector-gestuurd
    - uploads vereisen `ref` / `inputRef` en ondersteunen momenteel één bestand tegelijk
    - `responsebody`, PDF-export, downloadonderschepping en batchacties vereisen nog steeds een beheerde browser of onbewerkt CDP-profiel

  </Accordion>
</AccordionGroup>

## Sandboxing en geheugen

<AccordionGroup>
  <Accordion title="Is er een speciale sandboxing-doc?">
    Ja. Zie [Sandboxing](/nl/gateway/sandboxing). Zie [Docker](/nl/install/docker) voor Docker-specifieke setup (volledige Gateway in Docker of sandbox-images).
  </Accordion>

  <Accordion title="Docker voelt beperkt - hoe schakel ik volledige functies in?">
    De standaardimage is security-first en draait als de `node`-gebruiker, dus bevat deze geen
    systeempakketten, Homebrew of gebundelde browsers. Voor een completere setup:

    - Maak `/home/node` persistent met `OPENCLAW_HOME_VOLUME` zodat caches behouden blijven.
    - Bak systeemafhankelijkheden in de image met `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Installeer Playwright-browsers via de gebundelde CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Stel `PLAYWRIGHT_BROWSERS_PATH` in en zorg dat het pad persistent is.

    Docs: [Docker](/nl/install/docker), [Browser](/nl/tools/browser).

  </Accordion>

  <Accordion title="Kan ik DM's persoonlijk houden, maar groepen openbaar/gesandboxed maken met één agent?">
    Ja - als je privéverkeer **DM's** is en je openbare verkeer **groepen** zijn.

    Gebruik `agents.defaults.sandbox.mode: "non-main"` zodat groeps-/kanaalsessies (niet-hoofdsleutels) in de geconfigureerde sandbox-backend draaien, terwijl de hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest. Beperk daarna welke tools beschikbaar zijn in gesandboxte sessies via `tools.sandbox.tools`.

    Setup-walkthrough + voorbeeldconfiguratie: [Groepen: persoonlijke DM's + openbare groepen](/nl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Belangrijke configuratiereferentie: [Gateway-configuratie](/nl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Hoe bind ik een hostmap aan de sandbox?">
    Stel `agents.defaults.sandbox.docker.binds` in op `["host:path:mode"]` (bijv. `"/home/user/src:/src:ro"`). Globale en per-agent-binds worden samengevoegd; per-agent-binds worden genegeerd wanneer `scope: "shared"` is. Gebruik `:ro` voor alles wat gevoelig is en onthoud dat binds de muren van het sandboxbestandssysteem omzeilen.

    OpenClaw valideert bindbronnen tegen zowel het genormaliseerde pad als het canonieke pad dat via de diepste bestaande ancestor is opgelost. Dat betekent dat escapes via symlink-parents nog steeds gesloten falen, zelfs wanneer het laatste padsegment nog niet bestaat, en dat allowed-root-controles nog steeds gelden na symlinkresolutie.

    Zie [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts) en [Sandbox versus toolbeleid versus Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) voor voorbeelden en veiligheidsnotities.

  </Accordion>

  <Accordion title="Hoe werkt geheugen?">
    OpenClaw-geheugen bestaat gewoon uit Markdown-bestanden in de agentwerkruimte:

    - Dagelijkse notities in `memory/YYYY-MM-DD.md`
    - Gecureerde langetermijnnotities in `MEMORY.md` (alleen hoofd-/privésessies)

    OpenClaw voert ook een **stille geheugenflush vóór Compaction** uit om het model eraan te herinneren
    duurzame notities te schrijven vóór automatische Compaction. Dit draait alleen wanneer de werkruimte
    beschrijfbaar is (read-only sandboxes slaan dit over). Zie [Geheugen](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Het geheugen blijft dingen vergeten. Hoe zorg ik dat het blijft hangen?">
    Vraag de bot om **het feit naar het geheugen te schrijven**. Langetermijnnotities horen thuis in `MEMORY.md`,
    kortetermijncontext gaat naar `memory/YYYY-MM-DD.md`.

    Dit is nog steeds een gebied dat we verbeteren. Het helpt om het model eraan te herinneren herinneringen op te slaan;
    het weet wat het moet doen. Als het dingen blijft vergeten, controleer dan of de Gateway bij elke run dezelfde
    werkruimte gebruikt.

    Docs: [Geheugen](/nl/concepts/memory), [Agentwerkruimte](/nl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Blijft geheugen voor altijd bestaan? Wat zijn de limieten?">
    Geheugenbestanden staan op schijf en blijven bestaan totdat je ze verwijdert. De limiet is je
    opslag, niet het model. De **sessiecontext** wordt nog steeds beperkt door het contextvenster
    van het model, dus lange gesprekken kunnen worden gecomprimeerd of afgekapt. Daarom bestaat
    geheugenzoekopdracht: het haalt alleen de relevante delen terug in de context.

    Docs: [Geheugen](/nl/concepts/memory), [Context](/nl/concepts/context).

  </Accordion>

  <Accordion title="Vereist semantische geheugenzoekopdracht een OpenAI API-sleutel?">
    Alleen als je **OpenAI-embeddings** gebruikt. Codex OAuth dekt chat/completions en
    geeft **geen** toegang tot embeddings, dus **inloggen met Codex (OAuth of de
    Codex CLI-login)** helpt niet voor semantische geheugenzoekopdracht. OpenAI-embeddings
    hebben nog steeds een echte API-sleutel nodig (`OPENAI_API_KEY` of `models.providers.openai.apiKey`).

    Als je niet expliciet een provider instelt, gebruikt OpenClaw OpenAI-embeddings. Legacy
    configs waarin nog `memorySearch.provider = "auto"` staat, worden ook naar OpenAI herleid.
    Als er geen OpenAI API-sleutel beschikbaar is, blijft semantische geheugenzoekopdracht niet beschikbaar
    totdat je een sleutel configureert of expliciet een andere provider kiest.

    Als je liever lokaal blijft, stel dan `memorySearch.provider = "local"` in (en eventueel
    `memorySearch.fallback = "none"`). Als je Gemini-embeddings wilt, stel dan
    `memorySearch.provider = "gemini"` in en geef `GEMINI_API_KEY` op (of
    `memorySearch.remote.apiKey`). We ondersteunen **OpenAI-, OpenAI-compatibele, Gemini-,
    Voyage-, Mistral-, Bedrock-, Ollama-, LM Studio-, GitHub Copilot-, DeepInfra- of lokale**
    embeddingmodellen - zie [Geheugen](/nl/concepts/memory) voor de installatiedetails.

  </Accordion>
</AccordionGroup>

## Waar dingen op schijf staan

<AccordionGroup>
  <Accordion title="Worden alle gegevens die met OpenClaw worden gebruikt lokaal opgeslagen?">
    Nee - **de status van OpenClaw is lokaal**, maar **externe diensten zien nog steeds wat je naar hen stuurt**.

    - **Standaard lokaal:** sessies, geheugenbestanden, config en werkruimte staan op de Gateway-host
      (`~/.openclaw` + je werkruimtemap).
    - **Noodzakelijk extern:** berichten die je naar modelproviders (Anthropic/OpenAI/enz.) stuurt, gaan naar
      hun API's, en chatplatforms (WhatsApp/Telegram/Slack/enz.) slaan berichtgegevens op hun
      servers op.
    - **Jij bepaalt de voetafdruk:** lokale modellen gebruiken houdt prompts op je machine, maar channelverkeer
      gaat nog steeds via de servers van het channel.

    Gerelateerd: [Agentwerkruimte](/nl/concepts/agent-workspace), [Geheugen](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Waar slaat OpenClaw zijn gegevens op?">
    Alles staat onder `$OPENCLAW_STATE_DIR` (standaard: `~/.openclaw`):

    | Pad                                                             | Doel                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hoofdconfig (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy OAuth-import (bij eerste gebruik gekopieerd naar authprofielen) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Authprofielen (OAuth, API-sleutels en optionele `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionele bestandsgebaseerde secret-payload voor `file` SecretRef-providers |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy compatibiliteitsbestand (statische `api_key`-vermeldingen opgeschoond) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Providerstatus (bijv. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Status per agent (agentDir + sessies)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Gespreksgeschiedenis en status (per agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sessiemetadata (per agent)                                         |

    Legacy pad voor één agent: `~/.openclaw/agent/*` (gemigreerd door `openclaw doctor`).

    Je **werkruimte** (AGENTS.md, geheugenbestanden, Skills, enz.) is afzonderlijk en wordt geconfigureerd via `agents.defaults.workspace` (standaard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Waar moeten AGENTS.md / SOUL.md / USER.md / MEMORY.md staan?">
    Deze bestanden staan in de **agentwerkruimte**, niet in `~/.openclaw`.

    - **Werkruimte (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optioneel `HEARTBEAT.md`.
      Lowercase root `memory.md` is alleen legacy reparatie-invoer; `openclaw doctor --fix`
      kan het samenvoegen in `MEMORY.md` wanneer beide bestanden bestaan.
    - **Statusmap (`~/.openclaw`)**: config, channel-/providerstatus, authprofielen, sessies, logs,
      en gedeelde Skills (`~/.openclaw/skills`).

    De standaardwerkruimte is `~/.openclaw/workspace`, configureerbaar via:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Als de bot na een herstart "vergeet", controleer dan of de Gateway bij elke
    start dezelfde werkruimte gebruikt (en onthoud: remote mode gebruikt de **werkruimte van de gatewayhost**,
    niet je lokale laptop).

    Tip: als je duurzaam gedrag of een duurzame voorkeur wilt, vraag de bot dan om het **naar
    AGENTS.md of MEMORY.md te schrijven** in plaats van te vertrouwen op de chatgeschiedenis.

    Zie [Agentwerkruimte](/nl/concepts/agent-workspace) en [Geheugen](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Kan ik SOUL.md groter maken?">
    Ja. `SOUL.md` is een van de workspace-bootstrapbestanden die in de
    agentcontext worden geïnjecteerd. De standaardinjectielimiet per bestand is `20000` tekens,
    en het totale bootstrapbudget over bestanden heen is `60000` tekens.

    Wijzig de gedeelde standaardinstellingen in je OpenClaw-configuratie:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Of overschrijf één agent:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Gebruik `/context` om ruwe versus geïnjecteerde groottes te controleren en of er afkapping is gebeurd.
    Houd `SOUL.md` gericht op stem, houding en persoonlijkheid; zet operationele regels
    in `AGENTS.md` en duurzame feiten in het geheugen.

    Zie [Context](/nl/concepts/context) en [Agentconfiguratie](/nl/gateway/config-agents).

  </Accordion>

  <Accordion title="Aanbevolen back-upstrategie">
    Zet je **agentwerkruimte** in een **private** git-repo en maak er ergens
    privé een back-up van (bijvoorbeeld GitHub private). Dit legt geheugen + AGENTS/SOUL/USER-
    bestanden vast, en laat je later de "geest" van de assistent herstellen.

    Commit **niets** onder `~/.openclaw` (referenties, sessies, tokens of versleutelde secrets-payloads).
    Als je een volledig herstel nodig hebt, maak dan afzonderlijk een back-up van zowel de werkruimte als de statusmap
    (zie de migratievraag hierboven).

    Docs: [Agentwerkruimte](/nl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Hoe verwijder ik OpenClaw volledig?">
    Zie de speciale handleiding: [Verwijderen](/nl/install/uninstall).
  </Accordion>

  <Accordion title="Kunnen agents buiten de werkruimte werken?">
    Ja. De werkruimte is de **standaard-cwd** en geheugenanker, geen harde sandbox.
    Relatieve paden worden binnen de werkruimte opgelost, maar absolute paden kunnen andere
    hostlocaties benaderen tenzij sandboxing is ingeschakeld. Als je isolatie nodig hebt, gebruik dan
    [`agents.defaults.sandbox`](/nl/gateway/sandboxing) of sandboxinstellingen per agent. Als je
    wilt dat een repo de standaardwerkmap is, wijs dan de
    `workspace` van die agent naar de repo-root. De OpenClaw-repo is alleen broncode; houd de
    werkruimte gescheiden tenzij je bewust wilt dat de agent erin werkt.

    Voorbeeld (repo als standaard-cwd):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Externe modus: waar staat de sessieopslag?">
    Sessiestatus is eigendom van de **Gateway-host**. Als je in externe modus werkt, staat de sessieopslag waar je om geeft op de externe machine, niet op je lokale laptop. Zie [Sessiebeheer](/nl/concepts/session).
  </Accordion>
</AccordionGroup>

## Configuratiebasis

<AccordionGroup>
  <Accordion title="Welk formaat heeft de configuratie? Waar staat die?">
    OpenClaw leest een optionele **JSON5**-configuratie uit `$OPENCLAW_CONFIG_PATH` (standaard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Als het bestand ontbreekt, gebruikt het redelijk veilige standaardinstellingen (inclusief een standaardwerkruimte van `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ik heb gateway.bind: "lan" (of "tailnet") ingesteld en nu luistert er niets / de UI zegt unauthorized'>
    Niet-loopback binds **vereisen een geldig Gateway-authenticatiepad**. In de praktijk betekent dat:

    - authenticatie met gedeeld geheim: token of wachtwoord
    - `gateway.auth.mode: "trusted-proxy"` achter een correct geconfigureerde identiteitsbewuste reverse proxy

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Opmerkingen:

    - `gateway.remote.token` / `.password` schakelen lokale Gateway-authenticatie niet zelfstandig in.
    - Lokale aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
    - Stel voor wachtwoordauthenticatie in plaats daarvan `gateway.auth.mode: "password"` plus `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`) in.
    - Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de oplossing gesloten (geen maskering door externe fallback).
    - Control UI-setups met gedeeld geheim authenticeren via `connect.params.auth.token` of `connect.params.auth.password` (opgeslagen in app-/UI-instellingen). Modi met identiteit, zoals Tailscale Serve of `trusted-proxy`, gebruiken in plaats daarvan requestheaders. Vermijd gedeelde geheimen in URL's.
    - Met `gateway.auth.mode: "trusted-proxy"` vereisen loopback-reverseproxy's op dezelfde host expliciet `gateway.auth.trustedProxy.allowLoopback = true` en een loopback-item in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Waarom heb ik nu een token nodig op localhost?">
    OpenClaw dwingt standaard Gateway-authenticatie af, inclusief loopback. In het normale standaardpad betekent dat tokenauthenticatie: als er geen expliciet authenticatiepad is geconfigureerd, wordt het opstarten van de Gateway opgelost naar tokenmodus en wordt voor die start een token gegenereerd dat alleen tijdens runtime bestaat, dus **lokale WS-clients moeten authenticeren**. Configureer `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` of `OPENCLAW_GATEWAY_PASSWORD` expliciet wanneer clients een stabiel geheim nodig hebben over herstarts heen. Dit blokkeert andere lokale processen om de Gateway aan te roepen.

    Als je een ander authenticatiepad verkiest, kun je expliciet de wachtwoordmodus kiezen (of, voor identity-aware reverse proxies, `trusted-proxy`). Als je **echt** open loopback wilt, stel dan `gateway.auth.mode: "none"` expliciet in je configuratie in. Doctor kan op elk moment een token voor je genereren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Moet ik opnieuw starten nadat ik de configuratie heb gewijzigd?">
    De Gateway bewaakt de configuratie en ondersteunt hot-reload:

    - `gateway.reload.mode: "hybrid"` (standaard): veilige wijzigingen direct toepassen, opnieuw starten voor kritieke wijzigingen
    - `hot`, `restart`, `off` worden ook ondersteund

  </Accordion>

  <Accordion title="Hoe schakel ik grappige CLI-taglines uit?">
    Stel `cli.banner.taglineMode` in de configuratie in:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: verbergt tagline-tekst maar behoudt de bannertitel-/versieregel.
    - `default`: gebruikt elke keer `All your chats, one OpenClaw.`.
    - `random`: roterende grappige/seizoensgebonden taglines (standaardgedrag).
    - Als je helemaal geen banner wilt, stel dan env `OPENCLAW_HIDE_BANNER=1` in.

  </Accordion>

  <Accordion title="Hoe schakel ik web search (en web fetch) in?">
    `web_fetch` werkt zonder API-sleutel. `web_search` hangt af van je geselecteerde
    provider:

    - API-ondersteunde providers zoals Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity en Tavily vereisen hun normale API-sleutelconfiguratie.
    - Grok kan xAI OAuth uit modelauthenticatie hergebruiken, of terugvallen op `XAI_API_KEY` / pluginconfiguratie voor web search.
    - Ollama Web Search vereist geen sleutel, maar gebruikt je geconfigureerde Ollama-host en vereist `ollama signin`.
    - DuckDuckGo vereist geen sleutel, maar is een onofficiële HTML-gebaseerde integratie.
    - SearXNG vereist geen sleutel/kan zelf worden gehost; configureer `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Aanbevolen:** voer `openclaw configure --section web` uit en kies een provider.
    Alternatieven via omgevingsvariabelen:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth, `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` of `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` of `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` of `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Providerspecifieke web-search-configuratie staat nu onder `plugins.entries.<plugin>.config.webSearch.*`.
    Verouderde providerpaden `tools.web.search.*` worden tijdelijk nog geladen voor compatibiliteit, maar mogen niet voor nieuwe configuraties worden gebruikt.
    Firecrawl web-fetch-fallbackconfiguratie staat onder `plugins.entries.firecrawl.config.webFetch.*`.

    Opmerkingen:

    - Als je allowlists gebruikt, voeg dan `web_search`/`web_fetch`/`x_search` of `group:web` toe.
    - `web_fetch` is standaard ingeschakeld (tenzij expliciet uitgeschakeld).
    - Als `tools.web.fetch.provider` is weggelaten, detecteert OpenClaw automatisch de eerste beschikbare fetch-fallbackprovider op basis van beschikbare inloggegevens. De officiële Firecrawl-plugin levert die fallback.
    - Daemons lezen env-vars uit `~/.openclaw/.env` (of de serviceomgeving).

    Documentatie: [Webtools](/nl/tools/web).

  </Accordion>

  <Accordion title="config.apply heeft mijn configuratie gewist. Hoe herstel ik dit en voorkom ik het?">
    `config.apply` vervangt de **volledige configuratie**. Als je een gedeeltelijk object verzendt, wordt al het
    andere verwijderd.

    De huidige OpenClaw beschermt tegen veel onbedoelde overschrijvingen:

    - Configuratiewijzigingen die eigendom zijn van OpenClaw valideren de volledige configuratie na de wijziging voordat er wordt geschreven.
    - Ongeldige of destructieve writes die eigendom zijn van OpenClaw worden geweigerd en opgeslagen als `openclaw.json.rejected.*`.
    - Als een directe wijziging startup of hot reload breekt, faalt Gateway gesloten of slaat het de reload over; het herschrijft `openclaw.json` niet.
    - `openclaw doctor --fix` is eigenaar van herstel en kan de laatst bekende werkende configuratie herstellen terwijl het geweigerde bestand als `openclaw.json.clobbered.*` wordt opgeslagen.

    Herstellen:

    - Controleer `openclaw logs --follow` op `Invalid config at`, `Config write rejected:` of `config reload skipped (invalid config)`.
    - Inspecteer de nieuwste `openclaw.json.clobbered.*` of `openclaw.json.rejected.*` naast de actieve configuratie.
    - Voer `openclaw config validate` en `openclaw doctor --fix` uit.
    - Kopieer alleen de bedoelde sleutels terug met `openclaw config set` of `config.patch`.
    - Als je geen laatst bekende werkende configuratie of geweigerde payload hebt, herstel dan vanuit een back-up, of voer `openclaw doctor` opnieuw uit en configureer kanalen/modellen opnieuw.
    - Als dit onverwacht was, dien dan een bug in en voeg je laatst bekende configuratie of een back-up toe.
    - Een lokale coding agent kan vaak een werkende configuratie reconstrueren uit logs of geschiedenis.

    Voorkomen:

    - Gebruik `openclaw config set` voor kleine wijzigingen.
    - Gebruik `openclaw configure` voor interactieve wijzigingen.
    - Gebruik eerst `config.schema.lookup` wanneer je niet zeker bent van een exact pad of veldvorm; het retourneert een oppervlakkige schemaknoop plus samenvattingen van directe kinderen om verder in te zoomen.
    - Gebruik `config.patch` voor gedeeltelijke RPC-wijzigingen; houd `config.apply` alleen voor volledige configuratievervanging.
    - Als je de agentgerichte `gateway`-tool vanuit een agentrun gebruikt, blijft die writes naar `tools.exec.ask` / `tools.exec.security` weigeren (inclusief verouderde aliassen `tools.bash.*` die normaliseren naar dezelfde beschermde exec-paden).

    Documentatie: [Configuratie](/nl/cli/config), [Configureren](/nl/cli/configure), [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/nl/gateway/doctor).

  </Accordion>

  <Accordion title="Hoe voer ik een centrale Gateway uit met gespecialiseerde workers op verschillende apparaten?">
    Het gebruikelijke patroon is **één Gateway** (bijv. Raspberry Pi) plus **nodes** en **agents**:

    - **Gateway (centraal):** beheert kanalen (Signal/WhatsApp), routering en sessies.
    - **Nodes (apparaten):** Macs/iOS/Android verbinden als randapparaten en stellen lokale tools beschikbaar (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** afzonderlijke breinen/werkruimten voor speciale rollen (bijv. "Hetzner ops", "Persoonlijke gegevens").
    - **Sub-agents:** start achtergrondwerk vanuit een hoofdagent wanneer je parallellisme wilt.
    - **TUI:** verbind met de Gateway en wissel tussen agents/sessies.

    Documentatie: [Nodes](/nl/nodes), [Toegang op afstand](/nl/gateway/remote), [Multi-agentroutering](/nl/concepts/multi-agent), [Sub-agents](/nl/tools/subagents), [TUI](/nl/web/tui).

  </Accordion>

  <Accordion title="Kan de OpenClaw-browser headless draaien?">
    Ja. Het is een configuratieoptie:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Standaard is `false` (met zichtbare browser). Headless triggert op sommige sites eerder anti-botcontroles. Zie [Browser](/nl/tools/browser).

    Headless gebruikt dezelfde **Chromium-engine** en werkt voor de meeste automatisering (formulieren, klikken, scraping, logins). De belangrijkste verschillen:

    - Geen zichtbaar browservenster (gebruik screenshots als je beeldmateriaal nodig hebt).
    - Sommige sites zijn strenger over automatisering in headless-modus (CAPTCHA's, anti-bot).
      X/Twitter blokkeert bijvoorbeeld vaak headless-sessies.

  </Accordion>

  <Accordion title="Hoe gebruik ik Brave voor browserbesturing?">
    Stel `browser.executablePath` in op je Brave-binary (of een andere Chromium-gebaseerde browser) en start de Gateway opnieuw.
    Zie de volledige configuratievoorbeelden in [Browser](/nl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways en nodes op afstand

<AccordionGroup>
  <Accordion title="Hoe worden opdrachten doorgegeven tussen Telegram, de Gateway en nodes?">
    Telegram-berichten worden verwerkt door de **Gateway**. De Gateway voert de agent uit en
    roept pas daarna nodes aan via de **Gateway WebSocket** wanneer een node-tool nodig is:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes zien geen inkomend providerverkeer; ze ontvangen alleen node-RPC-aanroepen.

  </Accordion>

  <Accordion title="Hoe kan mijn agent toegang krijgen tot mijn computer als de Gateway op afstand wordt gehost?">
    Kort antwoord: **koppel je computer als node**. De Gateway draait elders, maar kan
    `node.*`-tools (scherm, camera, systeem) aanroepen op je lokale machine via de Gateway WebSocket.

    Typische configuratie:

    1. Voer de Gateway uit op de altijd beschikbare host (VPS/thuisserver).
    2. Zet de Gateway-host en je computer op dezelfde tailnet.
    3. Zorg dat de Gateway WS bereikbaar is (tailnet-bind of SSH-tunnel).
    4. Open de macOS-app lokaal en verbind in de modus **Remote over SSH** (of directe tailnet)
       zodat die zich als node kan registreren.
    5. Keur de node goed op de Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Er is geen aparte TCP-bridge vereist; nodes verbinden via de Gateway WebSocket.

    Beveiligingsherinnering: het koppelen van een macOS-node staat `system.run` op die machine toe. Koppel alleen
    apparaten die je vertrouwt en bekijk [Beveiliging](/nl/gateway/security).

    Documentatie: [Nodes](/nl/nodes), [Gateway-protocol](/nl/gateway/protocol), [macOS-modus op afstand](/nl/platforms/mac/remote), [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale is verbonden, maar ik krijg geen antwoorden. Wat nu?">
    Controleer de basiszaken:

    - Gateway draait: `openclaw gateway status`
    - Gateway-health: `openclaw status`
    - Kanaalhealth: `openclaw channels status`

    Verifieer daarna authenticatie en routering:

    - Als je Tailscale Serve gebruikt, controleer dan of `gateway.auth.allowTailscale` correct is ingesteld.
    - Als je via een SSH-tunnel verbindt, bevestig dan dat de lokale tunnel actief is en naar de juiste poort wijst.
    - Bevestig dat je allowlists (DM of groep) je account bevatten.

    Documentatie: [Tailscale](/nl/gateway/tailscale), [Toegang op afstand](/nl/gateway/remote), [Kanalen](/nl/channels).

  </Accordion>

  <Accordion title="Kunnen twee OpenClaw-instanties met elkaar praten (lokaal + VPS)?">
    Ja. Er is geen ingebouwde "bot-to-bot"-bridge, maar je kunt dit op een paar
    betrouwbare manieren koppelen:

    **Eenvoudigst:** gebruik een normaal chatkanaal waartoe beide bots toegang hebben (Telegram/Slack/WhatsApp).
    Laat Bot A een bericht naar Bot B sturen en laat Bot B daarna zoals gebruikelijk antwoorden.

    **CLI-bridge (generiek):** voer een script uit dat de andere Gateway aanroept met
    `openclaw agent --message ... --deliver`, gericht op een chat waarin de andere bot
    luistert. Als één bot op een externe VPS staat, richt je CLI dan op die externe Gateway
    via SSH/Tailscale (zie [Toegang op afstand](/nl/gateway/remote)).

    Voorbeeldpatroon (uitvoeren vanaf een machine die de doel-Gateway kan bereiken):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: voeg een guardrail toe zodat de twee bots niet eindeloos blijven loopen (alleen bij vermelding, kanaal-
    allowlists, of een regel "niet antwoorden op botberichten").

    Documentatie: [Toegang op afstand](/nl/gateway/remote), [Agent CLI](/nl/cli/agent), [Agent verzenden](/nl/tools/agent-send).

  </Accordion>

  <Accordion title="Heb ik aparte VPS'en nodig voor meerdere agents?">
    Nee. Eén Gateway kan meerdere agents hosten, elk met een eigen werkruimte, modelstandaarden
    en routering. Dat is de normale setup en is veel goedkoper en eenvoudiger dan
    één VPS per agent draaien.

    Gebruik aparte VPS'en alleen wanneer je harde isolatie (beveiligingsgrenzen) nodig hebt of zeer
    verschillende configuraties die je niet wilt delen. Houd anders één Gateway aan en
    gebruik meerdere agents of sub-agents.

  </Accordion>

  <Accordion title="Heeft het voordeel om een node op mijn persoonlijke laptop te gebruiken in plaats van SSH vanaf een VPS?">
    Ja - nodes zijn de volwaardige manier om je laptop te bereiken vanaf een externe Gateway, en ze
    bieden meer dan shelltoegang. De Gateway draait op macOS/Linux (Windows via WSL2) en is
    lichtgewicht (een kleine VPS of Raspberry Pi-klasse machine is prima; 4 GB RAM is ruim voldoende), dus een gebruikelijke
    opstelling is een altijd-aan host plus je laptop als node.

    - **Geen inkomende SSH vereist.** Nodes verbinden uitgaand met de Gateway WebSocket en gebruiken apparaatkoppeling.
    - **Veiligere uitvoeringscontroles.** `system.run` wordt begrensd door node-allowlists/goedkeuringen op die laptop.
    - **Meer apparaathulpmiddelen.** Nodes bieden naast `system.run` ook `canvas`, `camera` en `screen`.
    - **Lokale browserautomatisering.** Houd de Gateway op een VPS, maar draai Chrome lokaal via een node-host op de laptop, of koppel aan lokale Chrome op de host via Chrome MCP.

    SSH is prima voor ad-hoc shelltoegang, maar nodes zijn eenvoudiger voor doorlopende agentworkflows en
    apparaatautomatisering.

    Documentatie: [Nodes](/nl/nodes), [Nodes CLI](/nl/cli/nodes), [Browser](/nl/tools/browser).

  </Accordion>

  <Accordion title="Draaien nodes een gatewayservice?">
    Nee. Er hoort maar **één gateway** per host te draaien, tenzij je bewust geïsoleerde profielen draait (zie [Meerdere gateways](/nl/gateway/multiple-gateways)). Nodes zijn randapparaten die verbinden
    met de gateway (iOS/Android-nodes, of macOS-"node mode" in de menubalkapp). Voor headless node-
    hosts en CLI-bediening, zie [Node-host-CLI](/nl/cli/node).

    Een volledige herstart is vereist voor wijzigingen aan `gateway`, `discovery` en gehoste Plugin-oppervlakken.

  </Accordion>

  <Accordion title="Is er een API-/RPC-manier om configuratie toe te passen?">
    Ja.

    - `config.schema.lookup`: inspecteer één configuratiesubboom met de oppervlakkige schemanode, overeenkomende UI-hint en directe samenvattingen van kinderen voordat je schrijft
    - `config.get`: haal de huidige momentopname + hash op
    - `config.patch`: veilige gedeeltelijke update (aanbevolen voor de meeste RPC-bewerkingen); herlaadt waar mogelijk live en herstart waar vereist
    - `config.apply`: valideer + vervang de volledige configuratie; herlaadt waar mogelijk live en herstart waar vereist
    - De agentgerichte `gateway` runtime-tool weigert nog steeds `tools.exec.ask` / `tools.exec.security` te herschrijven; verouderde `tools.bash.*`-aliassen normaliseren naar dezelfde beschermde exec-paden

  </Accordion>

  <Accordion title="Minimale verstandige configuratie voor een eerste installatie">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dit stelt je werkruimte in en beperkt wie de bot kan activeren.

  </Accordion>

  <Accordion title="Hoe stel ik Tailscale in op een VPS en verbind ik vanaf mijn Mac?">
    Minimale stappen:

    1. **Installeren + inloggen op de VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installeren + inloggen op je Mac**
       - Gebruik de Tailscale-app en log in bij dezelfde tailnet.
    3. **MagicDNS inschakelen (aanbevolen)**
       - Schakel MagicDNS in de Tailscale-beheerconsole in zodat de VPS een stabiele naam heeft.
    4. **Gebruik de tailnet-hostnaam**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Als je de Control UI zonder SSH wilt, gebruik dan Tailscale Serve op de VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dit houdt de gateway gebonden aan loopback en stelt HTTPS beschikbaar via Tailscale. Zie [Tailscale](/nl/gateway/tailscale).

  </Accordion>

  <Accordion title="Hoe verbind ik een Mac-node met een externe Gateway (Tailscale Serve)?">
    Serve stelt de **Gateway Control UI + WS** beschikbaar. Nodes verbinden via hetzelfde Gateway WS-eindpunt.

    Aanbevolen opstelling:

    1. **Zorg dat de VPS + Mac op dezelfde tailnet zitten**.
    2. **Gebruik de macOS-app in externe modus** (SSH-doel kan de tailnet-hostnaam zijn).
       De app tunnelt de Gateway-poort en verbindt als node.
    3. **Keur de node goed** op de gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentatie: [Gateway-protocol](/nl/gateway/protocol), [Discovery](/nl/gateway/discovery), [macOS externe modus](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Moet ik installeren op een tweede laptop of gewoon een node toevoegen?">
    Als je alleen **lokale tools** (screen/camera/exec) op de tweede laptop nodig hebt, voeg die dan toe als een
    **node**. Zo behoud je één Gateway en voorkom je dubbele configuratie. Lokale node-tools zijn
    momenteel alleen macOS, maar we zijn van plan ze uit te breiden naar andere besturingssystemen.

    Installeer alleen een tweede Gateway wanneer je **harde isolatie** of twee volledig aparte bots nodig hebt.

    Documentatie: [Nodes](/nl/nodes), [Nodes CLI](/nl/cli/nodes), [Meerdere gateways](/nl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Omgevingsvariabelen en .env laden

<AccordionGroup>
  <Accordion title="Hoe laadt OpenClaw omgevingsvariabelen?">
    OpenClaw leest omgevingsvariabelen uit het bovenliggende proces (shell, launchd/systemd, CI, enz.) en laadt daarnaast:

    - `.env` uit de huidige werkmap
    - een globale fallback-`.env` uit `~/.openclaw/.env` (oftewel `$OPENCLAW_STATE_DIR/.env`)

    Geen van beide `.env`-bestanden overschrijft bestaande omgevingsvariabelen.
    Credentialvariabelen van providers vormen een uitzondering voor werkruimte-`.env`: sleutels zoals
    `GEMINI_API_KEY`, `XAI_API_KEY` of `MISTRAL_API_KEY` worden genegeerd vanuit werkruimte-
    `.env` en horen in de procesomgeving, `~/.openclaw/.env` of configuratie-`env` te staan.

    Je kunt ook inline omgevingsvariabelen in de configuratie definiëren (alleen toegepast als ze ontbreken in de procesomgeving):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Zie [/environment](/nl/help/environment) voor volledige prioriteit en bronnen.

  </Accordion>

  <Accordion title="Ik heb de Gateway via de service gestart en mijn omgevingsvariabelen zijn verdwenen. Wat nu?">
    Twee veelvoorkomende oplossingen:

    1. Zet de ontbrekende sleutels in `~/.openclaw/.env`, zodat ze worden opgepikt zelfs wanneer de service je shellomgeving niet erft.
    2. Schakel shellimport in (opt-in gemak):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Dit draait je login-shell en importeert alleen ontbrekende verwachte sleutels (overschrijft nooit). Equivalenten als omgevingsvariabelen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ik heb COPILOT_GITHUB_TOKEN ingesteld, maar modelstatus toont "Shellomgeving: uit." Waarom?'>
    `openclaw models status` rapporteert of **shellomgevingsimport** is ingeschakeld. "Shellomgeving: uit"
    betekent **niet** dat je omgevingsvariabelen ontbreken - het betekent alleen dat OpenClaw
    je login-shell niet automatisch laadt.

    Als de Gateway als service draait (launchd/systemd), erft die je shell-
    omgeving niet. Los dit op met een van deze opties:

    1. Zet het token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Of schakel shellimport in (`env.shellEnv.enabled: true`).
    3. Of voeg het toe aan het `env`-blok in je configuratie (alleen toegepast als het ontbreekt).

    Herstart daarna de gateway en controleer opnieuw:

    ```bash
    openclaw models status
    ```

    Copilot-tokens worden gelezen uit `COPILOT_GITHUB_TOKEN` (ook `GH_TOKEN` / `GITHUB_TOKEN`).
    Zie [/concepts/model-providers](/nl/concepts/model-providers) en [/environment](/nl/help/environment).

  </Accordion>
</AccordionGroup>

## Sessies en meerdere chats

<AccordionGroup>
  <Accordion title="Hoe start ik een nieuw gesprek?">
    Stuur `/new` of `/reset` als zelfstandig bericht. Zie [Sessiebeheer](/nl/concepts/session).
  </Accordion>

  <Accordion title="Worden sessies automatisch gereset als ik nooit /new stuur?">
    Sessies kunnen verlopen na `session.idleMinutes`, maar dit is **standaard uitgeschakeld** (standaard **0**).
    Stel dit in op een positieve waarde om verlopen bij inactiviteit in te schakelen. Wanneer ingeschakeld, start het **volgende**
    bericht na de inactieve periode een nieuwe sessie-id voor die chatsleutel.
    Dit verwijdert geen transcripties - het start alleen een nieuwe sessie.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Is er een manier om een team van OpenClaw-instanties te maken (één CEO en veel agents)?">
    Ja, via **multi-agent-routing** en **sub-agents**. Je kunt één coördinator-
    agent en meerdere worker-agents maken met hun eigen werkruimten en modellen.

    Dat gezegd hebbende kun je dit het best zien als een **leuk experiment**. Het gebruikt veel tokens en is vaak
    minder efficiënt dan één bot met aparte sessies gebruiken. Het typische model dat wij
    voor ons zien is één bot waarmee je praat, met verschillende sessies voor parallel werk. Die
    bot kan waar nodig ook sub-agents starten.

    Documentatie: [Multi-agent-routing](/nl/concepts/multi-agent), [Sub-agents](/nl/tools/subagents), [Agents CLI](/nl/cli/agents).

  </Accordion>

  <Accordion title="Waarom werd context midden in een taak afgekapt? Hoe voorkom ik dat?">
    Sessiecontext wordt beperkt door het modelvenster. Lange chats, grote tooluitvoer of veel
    bestanden kunnen Compaction of afkapping activeren.

    Wat helpt:

    - Vraag de bot om de huidige staat samen te vatten en naar een bestand te schrijven.
    - Gebruik `/compact` vóór lange taken, en `/new` wanneer je van onderwerp wisselt.
    - Houd belangrijke context in de werkruimte en vraag de bot die terug te lezen.
    - Gebruik sub-agents voor lang of parallel werk zodat de hoofdchat kleiner blijft.
    - Kies een model met een groter contextvenster als dit vaak gebeurt.

  </Accordion>

  <Accordion title="Hoe reset ik OpenClaw volledig maar houd ik het geïnstalleerd?">
    Gebruik de resetopdracht:

    ```bash
    openclaw reset
    ```

    Niet-interactieve volledige reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Voer daarna setup opnieuw uit:

    ```bash
    openclaw onboard --install-daemon
    ```

    Opmerkingen:

    - Onboarding biedt ook **Reset** als er een bestaande configuratie wordt gevonden. Zie [Onboarding (CLI)](/nl/start/wizard).
    - Als je profielen hebt gebruikt (`--profile` / `OPENCLAW_PROFILE`), reset dan elke state-dir (standaarden zijn `~/.openclaw-<profile>`).
    - Dev-reset: `openclaw gateway --dev --reset` (alleen dev; wist dev-configuratie + credentials + sessies + werkruimte).

  </Accordion>

  <Accordion title='Ik krijg fouten "context te groot" - hoe reset of compacteer ik?'>
    Gebruik een van deze:

    - **Compacteer** (behoudt het gesprek maar vat oudere beurten samen):

      ```
      /compact
      ```

      of `/compact <instructions>` om de samenvatting te sturen.

    - **Reset** (nieuwe sessie-ID voor dezelfde chatsleutel):

      ```
      /new
      /reset
      ```

    Als het blijft gebeuren:

    - Schakel **sessie-opschoning** (`agents.defaults.contextPruning`) in of stem die af om oude tooluitvoer te beperken.
    - Gebruik een model met een groter contextvenster.

    Documentatie: [Compaction](/nl/concepts/compaction), [Sessie-opschoning](/nl/concepts/session-pruning), [Sessiebeheer](/nl/concepts/session).

  </Accordion>

  <Accordion title='Waarom zie ik "LLM-aanvraag geweigerd: messages.content.tool_use.input-veld vereist"?'>
    Dit is een providervalidatiefout: het model heeft een `tool_use`-blok uitgevoerd zonder de vereiste
    `input`. Dit betekent meestal dat de sessiegeschiedenis verouderd of beschadigd is (vaak na lange threads
    of een tool-/schemawijziging).

    Oplossing: start een nieuwe sessie met `/new` (zelfstandig bericht).

  </Accordion>

  <Accordion title="Waarom krijg ik elke 30 minuten Heartbeat-berichten?">
    Heartbeats draaien standaard elke **30m** (**1h** bij gebruik van OAuth-authenticatie). Stem ze af of schakel ze uit:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Als `HEARTBEAT.md` bestaat maar in feite leeg is (alleen lege regels,
    Markdown-/HTML-opmerkingen, Markdown-koppen zoals `# Heading`, fence-markeringen,
    of lege checklist-stubs), slaat OpenClaw de heartbeat-run over om API-aanroepen te besparen.
    Als het bestand ontbreekt, draait de heartbeat nog steeds en beslist het model wat te doen.

    Overrides per agent gebruiken `agents.list[].heartbeat`. Documentatie: [Heartbeat](/nl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Moet ik een "botaccount" toevoegen aan een WhatsApp-groep?'>
    Nee. OpenClaw draait op **je eigen account**, dus als jij in de groep zit, kan OpenClaw die zien.
    Standaard worden groepsantwoorden geblokkeerd totdat je afzenders toestaat (`groupPolicy: "allowlist"`).

    Als je wilt dat alleen **jij** groepsantwoorden kunt activeren:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Hoe krijg ik de JID van een WhatsApp-groep?">
    Optie 1 (snelst): volg logs en stuur een testbericht in de groep:

    ```bash
    openclaw logs --follow --json
    ```

    Zoek naar `chatId` (of `from`) dat eindigt op `@g.us`, zoals:
    `1234567890-1234567890@g.us`.

    Optie 2 (als al geconfigureerd/op de allowlist gezet): toon groepen uit de configuratie:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentatie: [WhatsApp](/nl/channels/whatsapp), [Directory](/nl/cli/directory), [Logs](/nl/cli/logs).

  </Accordion>

  <Accordion title="Waarom antwoordt OpenClaw niet in een groep?">
    Twee veelvoorkomende oorzaken:

    - Vermeldingsfiltering staat aan (standaard). Je moet de bot @vermelden (of overeenkomen met `mentionPatterns`).
    - Je hebt `channels.whatsapp.groups` geconfigureerd zonder `"*"` en de groep staat niet op de allowlist.

    Zie [Groepen](/nl/channels/groups) en [Groepsberichten](/nl/channels/group-messages).

  </Accordion>

  <Accordion title="Delen groepen/threads context met DM's?">
    Directe chats worden standaard samengevoegd met de hoofdsessie. Groepen/kanalen hebben hun eigen sessiesleutels, en Telegram-onderwerpen / Discord-threads zijn afzonderlijke sessies. Zie [Groepen](/nl/channels/groups) en [Groepsberichten](/nl/channels/group-messages).
  </Accordion>

  <Accordion title="Hoeveel werkruimten en agents kan ik maken?">
    Geen harde limieten. Tientallen (zelfs honderden) zijn prima, maar let op:

    - **Schijfgroei:** sessies + transcripties staan onder `~/.openclaw/agents/<agentId>/sessions/`.
    - **Tokenkosten:** meer agents betekent meer gelijktijdig modelgebruik.
    - **Operationele overhead:** auth-profielen, werkruimten en kanaalroutering per agent.

    Tips:

    - Houd één **actieve** werkruimte per agent (`agents.defaults.workspace`).
    - Ruim oude sessies op (verwijder JSONL- of store-items) als de schijf groeit.
    - Gebruik `openclaw doctor` om verdwaalde werkruimten en profielmismatches te vinden.

  </Accordion>

  <Accordion title="Kan ik meerdere bots of chats tegelijk draaien (Slack), en hoe moet ik dat instellen?">
    Ja. Gebruik **Multi-Agent Routing** om meerdere geïsoleerde agents te draaien en inkomende berichten te routeren op
    kanaal/account/peer. Slack wordt ondersteund als kanaal en kan aan specifieke agents worden gekoppeld.

    Browsertoegang is krachtig, maar niet "alles kunnen wat een mens kan" - anti-bot, CAPTCHA's en MFA kunnen
    automatisering nog steeds blokkeren. Gebruik voor de meest betrouwbare browserbesturing lokale Chrome MCP op de host,
    of gebruik CDP op de machine waarop de browser daadwerkelijk draait.

    Aanbevolen setup:

    - Altijd-aan Gateway-host (VPS/Mac mini).
    - Eén agent per rol (bindingen).
    - Slack-kanaal/kanalen gekoppeld aan die agents.
    - Lokale browser via Chrome MCP of een node wanneer nodig.

    Documentatie: [Multi-Agent Routing](/nl/concepts/multi-agent), [Slack](/nl/channels/slack),
    [Browser](/nl/tools/browser), [Nodes](/nl/nodes).

  </Accordion>
</AccordionGroup>

## Modellen, failover en auth-profielen

Modelvragen en -antwoorden — standaarden, selectie, aliassen, wisselen, failover, auth-profielen —
staan in de [Modellen-FAQ](/nl/help/faq-models).

## Gateway: poorten, "draait al" en externe modus

<AccordionGroup>
  <Accordion title="Welke poort gebruikt de Gateway?">
    `gateway.port` beheert de enkele gemultiplexte poort voor WebSocket + HTTP (Control UI, hooks, enzovoort).

    Voorrang:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Waarom zegt openclaw gateway status "Runtime: running" maar "Connectivity probe: failed"?'>
    Omdat "running" de weergave van de **supervisor** is (launchd/systemd/schtasks). De connectiviteitsprobe is de CLI die daadwerkelijk verbinding maakt met de gateway-WebSocket.

    Gebruik `openclaw gateway status` en vertrouw op deze regels:

    - `Probe target:` (de URL die de probe daadwerkelijk heeft gebruikt)
    - `Listening:` (wat daadwerkelijk aan de poort is gebonden)
    - `Last gateway error:` (veelvoorkomende hoofdoorzaak wanneer het proces leeft maar de poort niet luistert)

  </Accordion>

  <Accordion title='Waarom toont openclaw gateway status verschillende waarden voor "Config (cli)" en "Config (service)"?'>
    Je bewerkt één configuratiebestand terwijl de service een ander gebruikt (vaak een mismatch met `--profile` / `OPENCLAW_STATE_DIR`).

    Oplossing:

    ```bash
    openclaw gateway install --force
    ```

    Voer dat uit vanuit hetzelfde `--profile` / dezelfde omgeving die je de service wilt laten gebruiken.

  </Accordion>

  <Accordion title='Wat betekent "another gateway instance is already listening"?'>
    OpenClaw dwingt een runtime-lock af door de WebSocket-listener meteen bij het opstarten te binden (standaard `ws://127.0.0.1:18789`). Als het binden mislukt met `EADDRINUSE`, gooit het `GatewayLockError`, wat aangeeft dat er al een andere instantie luistert.

    Oplossing: stop de andere instantie, maak de poort vrij, of draai met `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Hoe draai ik OpenClaw in externe modus (client maakt verbinding met een Gateway elders)?">
    Stel `gateway.mode: "remote"` in en wijs naar een externe WebSocket-URL, optioneel met externe credentials via een gedeeld geheim:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Opmerkingen:

    - `openclaw gateway` start alleen wanneer `gateway.mode` `local` is (of wanneer je de override-vlag meegeeft).
    - De macOS-app bekijkt het configuratiebestand en wisselt live van modus wanneer deze waarden veranderen.
    - `gateway.remote.token` / `.password` zijn alleen externe credentials aan clientzijde; ze schakelen op zichzelf geen lokale gateway-auth in.

  </Accordion>

  <Accordion title='De Control UI zegt "unauthorized" (of blijft opnieuw verbinden). Wat nu?'>
    Je gateway-authpad en de auth-methode van de UI komen niet overeen.

    Feiten (uit code):

    - De Control UI bewaart het token in `sessionStorage` voor de huidige browsertabsessie en geselecteerde gateway-URL, zodat verversen in dezelfde tab blijft werken zonder langdurige tokenpersistentie in localStorage te herstellen.
    - Bij `AUTH_TOKEN_MISMATCH` kunnen vertrouwde clients één begrensde retry proberen met een gecacht apparaattoken wanneer de gateway retry-hints teruggeeft (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Die retry met gecacht token gebruikt nu opnieuw de gecachte goedgekeurde scopes die bij het apparaattoken zijn opgeslagen. Callers met expliciete `deviceToken` / expliciete `scopes` behouden nog steeds hun aangevraagde scopeset in plaats van gecachte scopes te erven.
    - Buiten dat retry-pad is de auth-voorrang bij verbinden eerst expliciet gedeeld token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken, daarna bootstrap-token.
    - Ingebouwde setup-code-bootstrap is alleen voor nodes. Na goedkeuring retourneert die een node-apparaattoken met `scopes: []` en retourneert geen overgedragen operator-token.

    Oplossing:

    - Snelst: `openclaw dashboard` (print + kopieert de dashboard-URL, probeert te openen; toont SSH-hint als headless).
    - Als je nog geen token hebt: `openclaw doctor --generate-gateway-token`.
    - Indien extern, tunnel eerst: `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`.
    - Modus met gedeeld geheim: stel `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` in, en plak daarna het overeenkomende geheim in de Control UI-instellingen.
    - Tailscale Serve-modus: zorg dat `gateway.auth.allowTailscale` is ingeschakeld en dat je de Serve-URL opent, niet een ruwe loopback-/tailnet-URL die Tailscale-identiteitsheaders omzeilt.
    - Trusted-proxy-modus: zorg dat je via de geconfigureerde identity-aware proxy binnenkomt, niet via een ruwe gateway-URL. Same-host loopback-proxy's hebben ook `gateway.auth.trustedProxy.allowLoopback = true` nodig.
    - Als de mismatch na die ene retry blijft bestaan, roteer/keur het gekoppelde apparaattoken opnieuw goed:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Als die rotate-aanroep zegt dat die is geweigerd, controleer twee dingen:
      - gekoppelde apparaatsessies kunnen alleen hun **eigen** apparaat roteren, tenzij ze ook `operator.admin` hebben
      - expliciete `--scope`-waarden mogen de huidige operator-scopes van de caller niet overschrijden
    - Nog steeds vast? Draai `openclaw status --all` en volg [Probleemoplossing](/nl/gateway/troubleshooting). Zie [Dashboard](/nl/web/dashboard) voor auth-details.

  </Accordion>

  <Accordion title="Ik heb gateway.bind ingesteld op tailnet, maar het kan niet binden en niets luistert">
    `tailnet`-binding kiest een Tailscale-IP uit je netwerkinterfaces (100.64.0.0/10). Als de machine niet op Tailscale zit (of de interface down is), is er niets om aan te binden.

    Oplossing:

    - Start Tailscale op die host (zodat die een 100.x-adres heeft), of
    - Schakel over naar `gateway.bind: "loopback"` / `"lan"`.

    Opmerking: `tailnet` is expliciet. `auto` geeft de voorkeur aan loopback; gebruik `gateway.bind: "tailnet"` wanneer je een binding wilt die alleen via tailnet loopt.

  </Accordion>

  <Accordion title="Kan ik meerdere Gateways op dezelfde host draaien?">
    Meestal niet - één Gateway kan meerdere berichtkanalen en agents draaien. Gebruik meerdere Gateways alleen wanneer je redundantie nodig hebt (bijv. reddingsbot) of harde isolatie.

    Ja, maar je moet isoleren:

    - `OPENCLAW_CONFIG_PATH` (configuratie per instantie)
    - `OPENCLAW_STATE_DIR` (state per instantie)
    - `agents.defaults.workspace` (werkruimte-isolatie)
    - `gateway.port` (unieke poorten)

    Snelle setup (aanbevolen):

    - Gebruik `openclaw --profile <name> ...` per instantie (maakt automatisch `~/.openclaw-<name>` aan).
    - Stel een unieke `gateway.port` in elke profielconfiguratie in (of geef `--port` mee voor handmatige runs).
    - Installeer een service per profiel: `openclaw --profile <name> gateway install`.

    Profielen voegen ook een suffix toe aan servicenamen (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Volledige gids: [Meerdere gateways](/nl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Wat betekent "invalid handshake" / code 1008?'>
    De Gateway is een **WebSocket-server**, en verwacht dat het allereerste bericht
    een `connect`-frame is. Als die iets anders ontvangt, sluit hij de verbinding
    met **code 1008** (beleidsschending).

    Veelvoorkomende oorzaken:

    - Je hebt de **HTTP**-URL in een browser geopend (`http://...`) in plaats van een WS-client te gebruiken.
    - Je hebt de verkeerde poort of het verkeerde pad gebruikt.
    - Een proxy of tunnel heeft auth-headers verwijderd of een niet-Gateway-verzoek gestuurd.

    Snelle oplossingen:

    1. Gebruik de WS-URL: `ws://<host>:18789` (of `wss://...` als HTTPS wordt gebruikt).
    2. Open de WS-poort niet in een normale browsertab.
    3. Als auth aan staat, neem dan het token/wachtwoord op in het `connect`-frame.

    Als je de CLI of TUI gebruikt, moet de URL er zo uitzien:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protocolgegevens: [Gateway-protocol](/nl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging en debugging

<AccordionGroup>
  <Accordion title="Waar staan logs?">
    Bestandslogs (gestructureerd):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Je kunt een stabiel pad instellen via `logging.file`. Het logniveau voor bestanden wordt geregeld door `logging.level`. Console-uitgebreidheid wordt geregeld door `--verbose` en `logging.consoleLevel`.

    Snelste log-tail:

    ```bash
    openclaw logs --follow
    ```

    Service-/supervisorlogs (wanneer de Gateway via launchd/systemd draait):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profielen gebruiken `gateway-<profile>.log`; stderr wordt onderdrukt)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Zie [Probleemoplossing](/nl/gateway/troubleshooting) voor meer informatie.

  </Accordion>

  <Accordion title="Hoe start/stop/herstart ik de Gateway-service?">
    Gebruik de Gateway-helpers:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Als je de Gateway handmatig uitvoert, kan `openclaw gateway --force` de poort terugnemen. Zie [Gateway](/nl/gateway).

  </Accordion>

  <Accordion title="Ik heb mijn terminal op Windows gesloten - hoe herstart ik OpenClaw?">
    Er zijn **drie Windows-installatiemodi**:

    **1) Lokale Windows Hub-installatie:** de native app beheert een lokale, app-eigen WSL Gateway.

    Open **OpenClaw Companion** vanuit het Start-menu of systeemvak en gebruik daarna
    **Gateway Setup** of het tabblad Connections.

    **2) Handmatige WSL2 Gateway:** de Gateway draait binnen Linux.

    Open PowerShell, ga naar WSL en herstart daarna:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Als je de service nooit hebt geïnstalleerd, start die dan op de voorgrond:

    ```bash
    openclaw gateway run
    ```

    **3) Native Windows CLI/Gateway:** de Gateway draait rechtstreeks in Windows.

    Open PowerShell en voer uit:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Als je die handmatig uitvoert (geen service), gebruik dan:

    ```powershell
    openclaw gateway run
    ```

    Docs: [Windows](/nl/platforms/windows), [Gateway-service-runbook](/nl/gateway).

  </Accordion>

  <Accordion title="De Gateway is actief, maar antwoorden komen nooit aan. Wat moet ik controleren?">
    Begin met een snelle gezondheidscontrole:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Veelvoorkomende oorzaken:

    - Modelauthenticatie is niet geladen op de **Gateway-host** (controleer `models status`).
    - Kanaalkoppeling/allowlist blokkeert antwoorden (controleer kanaalconfiguratie + logs).
    - WebChat/Dashboard is open zonder het juiste token.

    Als je extern bent, controleer dan of de tunnel-/Tailscale-verbinding actief is en of de
    Gateway WebSocket bereikbaar is.

    Docs: [Kanalen](/nl/channels), [Probleemoplossing](/nl/gateway/troubleshooting), [Externe toegang](/nl/gateway/remote).

  </Accordion>

  <Accordion title='"Verbinding met Gateway verbroken: geen reden" - wat nu?'>
    Dit betekent meestal dat de UI de WebSocket-verbinding is kwijtgeraakt. Controleer:

    1. Draait de Gateway? `openclaw gateway status`
    2. Is de Gateway gezond? `openclaw status`
    3. Heeft de UI het juiste token? `openclaw dashboard`
    4. Als je extern bent, is de tunnel-/Tailscale-link actief?

    Bekijk daarna de logs live:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/nl/web/dashboard), [Externe toegang](/nl/gateway/remote), [Probleemoplossing](/nl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands mislukt. Wat moet ik controleren?">
    Begin met logs en kanaalstatus:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Koppel daarna de fout:

    - `BOT_COMMANDS_TOO_MUCH`: het Telegram-menu heeft te veel items. OpenClaw kapt al af tot de Telegram-limiet en probeert opnieuw met minder commando's, maar sommige menu-items moeten nog steeds worden verwijderd. Verminder plugin-/skill-/aangepaste commando's, of schakel `channels.telegram.commands.native` uit als je het menu niet nodig hebt.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, of vergelijkbare netwerkfouten: als je op een VPS zit of achter een proxy, controleer dan of uitgaand HTTPS is toegestaan en DNS werkt voor `api.telegram.org`.

    Als de Gateway extern is, zorg er dan voor dat je naar logs op de Gateway-host kijkt.

    Docs: [Telegram](/nl/channels/telegram), [Kanaalprobleemoplossing](/nl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI toont geen uitvoer. Wat moet ik controleren?">
    Controleer eerst of de Gateway bereikbaar is en de agent kan draaien:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Gebruik in de TUI `/status` om de huidige status te zien. Als je antwoorden verwacht in een chatkanaal,
    zorg er dan voor dat aflevering is ingeschakeld (`/deliver on`).

    Docs: [TUI](/nl/web/tui), [Slash-commando's](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Hoe stop ik de Gateway volledig en start ik die daarna weer?">
    Als je de service hebt geïnstalleerd:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dit stopt/start de **bewaakte service** (launchd op macOS, systemd op Linux).
    Gebruik dit wanneer de Gateway op de achtergrond als daemon draait.

    Als je op de voorgrond draait, stop dan met Ctrl-C en daarna:

    ```bash
    openclaw gateway run
    ```

    Docs: [Gateway-service-runbook](/nl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart versus openclaw gateway">
    - `openclaw gateway restart`: herstart de **achtergrondservice** (launchd/systemd).
    - `openclaw gateway`: voert de Gateway **op de voorgrond** uit voor deze terminalsessie.

    Als je de service hebt geïnstalleerd, gebruik dan de Gateway-commando's. Gebruik `openclaw gateway` wanneer
    je een eenmalige voorgronduitvoering wilt.

  </Accordion>

  <Accordion title="Snelste manier om meer details te krijgen wanneer iets mislukt">
    Start de Gateway met `--verbose` om meer consoledetails te krijgen. Inspecteer daarna het logbestand op kanaalauthenticatie, modelroutering en RPC-fouten.
  </Accordion>
</AccordionGroup>

## Media en bijlagen

<AccordionGroup>
  <Accordion title="Mijn skill heeft een afbeelding/PDF gegenereerd, maar er is niets verzonden">
    Uitgaande bijlagen van de agent moeten gestructureerde mediavelden gebruiken, zoals `media`, `mediaUrl`, `path` of `filePath`. Zie [OpenClaw-assistent instellen](/nl/start/openclaw) en [Agent verzenden](/nl/tools/agent-send).

    Verzenden via CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Controleer ook:

    - Het doelkanaal ondersteunt uitgaande media en wordt niet geblokkeerd door allowlists.
    - Het bestand valt binnen de groottelimieten van de provider (afbeeldingen worden verkleind tot maximaal 2048px).
    - `tools.fs.workspaceOnly=true` beperkt verzendingen via lokale paden tot de workspace, temp-/media-store en door de sandbox gevalideerde bestanden.
    - `tools.fs.workspaceOnly=false` laat gestructureerde lokale mediaverzendingen host-lokale bestanden gebruiken die de agent al kan lezen, maar alleen voor media plus veilige documenttypen (afbeeldingen, audio, video, PDF, Office-documenten en gevalideerde tekstdocumenten zoals Markdown/MD, TXT, JSON, YAML en YML). Dit is geen secret scanner: een door de agent leesbaar `secret.txt` of `config.json` kan worden bijgevoegd wanneer de extensie en contentvalidatie overeenkomen. Houd gevoelige bestanden buiten paden die de agent kan lezen, of houd `tools.fs.workspaceOnly=true` aan voor strengere verzendingen via lokale paden.

    Zie [Afbeeldingen](/nl/nodes/images).

  </Accordion>
</AccordionGroup>

## Beveiliging en toegangscontrole

<AccordionGroup>
  <Accordion title="Is het veilig om OpenClaw bloot te stellen aan inkomende DM's?">
    Behandel inkomende DM's als niet-vertrouwde invoer. Standaarden zijn ontworpen om risico te verminderen:

    - Standaardgedrag op kanalen die DM's ondersteunen is **koppeling**:
      - Onbekende afzenders ontvangen een koppelcode; de bot verwerkt hun bericht niet.
      - Keur goed met: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Openstaande aanvragen zijn beperkt tot **3 per kanaal**; controleer `openclaw pairing list --channel <channel> [--account <id>]` als een code niet is aangekomen.
    - DM's openbaar openen vereist expliciete opt-in (`dmPolicy: "open"` en allowlist `"*"`).

    Voer `openclaw doctor` uit om risicovolle DM-beleidsregels zichtbaar te maken.

  </Accordion>

  <Accordion title="Is promptinjectie alleen een zorg voor openbare bots?">
    Nee. Promptinjectie gaat over **niet-vertrouwde content**, niet alleen over wie de bot een DM kan sturen.
    Als je assistent externe content leest (webzoekopdracht/ophalen, browserpagina's, e-mails,
    docs, bijlagen, geplakte logs), kan die content instructies bevatten die proberen
    het model te kapen. Dit kan zelfs gebeuren als **jij de enige afzender bent**.

    Het grootste risico ontstaat wanneer tools zijn ingeschakeld: het model kan worden misleid om
    context te exfiltreren of namens jou tools aan te roepen. Beperk de impact door:

    - een alleen-lezen of tool-uitgeschakelde "reader"-agent te gebruiken om niet-vertrouwde content samen te vatten
    - `web_search` / `web_fetch` / `browser` uit te houden voor agents met tools ingeschakeld
    - gedecodeerde bestands-/documenttekst ook als niet-vertrouwd te behandelen: OpenResponses
      `input_file` en extractie van mediabijlagen verpakken geëxtraheerde tekst beide in
      expliciete grensmarkeringen voor externe content in plaats van ruwe bestandstekst door te geven
    - sandboxing en strikte tool-allowlists te gebruiken

    Details: [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Is OpenClaw minder veilig omdat het TypeScript/Node gebruikt in plaats van Rust/WASM?">
    Taal en runtime doen ertoe, maar ze vormen niet het grootste risico voor een persoonlijke
    agent. De praktische OpenClaw-risico's zijn Gateway-blootstelling, wie de
    bot berichten kan sturen, promptinjectie, toolbereik, omgang met referenties, browsertoegang, exec-
    toegang en vertrouwen in externe skills of plugins.

    Rust en WASM kunnen sterkere isolatie bieden voor sommige klassen code, maar
    ze lossen promptinjectie, slechte allowlists, openbare Gateway-blootstelling,
    te brede tools of een browserprofiel dat al is ingelogd op gevoelige
    accounts niet op. Behandel die als de primaire controles:

    - houd de Gateway privé of geauthenticeerd
    - gebruik koppeling en allowlists voor DM's en groepen
    - weiger of sandbox risicovolle tools voor niet-vertrouwde invoer
    - installeer alleen vertrouwde plugins en skills
    - voer `openclaw security audit --deep` uit na configuratiewijzigingen

    Details: [Beveiliging](/nl/gateway/security), [Sandboxing](/nl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Ik zag meldingen over blootgestelde OpenClaw-instanties. Wat moet ik controleren?">
    Controleer eerst je daadwerkelijke deployment:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Een veiligere basislijn is:

    - Gateway gebonden aan `loopback`, of alleen blootgesteld via geauthenticeerde privé-
      toegang zoals een tailnet, SSH-tunnel, token-/wachtwoordauthenticatie of een correct
      geconfigureerde vertrouwde proxy
    - DM's in `pairing`- of `allowlist`-modus
    - groepen op een allowlist en met vermelding verplicht, tenzij elk lid vertrouwd is
    - tools met hoog risico (`exec`, `browser`, `gateway`, `cron`) geweigerd of strak
      afgebakend voor agents die niet-vertrouwde content lezen
    - sandboxing ingeschakeld waar tooluitvoering een kleinere impactzone nodig heeft

    Openbare binds zonder authenticatie, open DM's/groepen met tools en blootgestelde browser-
    bediening zijn de bevindingen die je eerst moet oplossen. Details:
    [Checklist voor beveiligingsaudit](/nl/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Zijn ClawHub-skills en plugins van derden veilig om te installeren?">
    Behandel skills en plugins van derden als code die je kiest te vertrouwen.
    ClawHub-skillpagina's tonen scanstatus vóór installatie, maar scans zijn geen
    volledige beveiligingsgrens. OpenClaw voert geen ingebouwde lokale
    blokkering van gevaarlijke code uit tijdens installatie-/updateflows voor plugins of skills; gebruik
    door de operator beheerde `security.installPolicy` voor lokale allow-/block-beslissingen.

    Veiliger patroon:

    - geef de voorkeur aan vertrouwde auteurs en vastgepinde versies
    - lees de skill of Plugin voordat je die inschakelt
    - houd allowlists voor plugins en skills smal
    - voer workflows met niet-vertrouwde invoer uit in een sandbox met minimale tools
    - voorkom dat code van derden brede toegang krijgt tot het bestandssysteem, exec, browser of secrets

    Details: [Skills](/nl/tools/skills), [Plugins](/nl/tools/plugin),
    [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Moet mijn bot een eigen e-mailadres, GitHub-account of telefoonnummer hebben?">
    Ja, voor de meeste configuraties. Door de bot te isoleren met aparte accounts en telefoonnummers
    beperk je de impact als er iets misgaat. Dit maakt het ook makkelijker om
    referenties te roteren of toegang in te trekken zonder je persoonlijke accounts te beïnvloeden.

    Begin klein. Geef alleen toegang tot de tools en accounts die je echt nodig hebt, en breid
    later uit als dat nodig is.

    Docs: [Beveiliging](/nl/gateway/security), [Koppelen](/nl/channels/pairing).

  </Accordion>

  <Accordion title="Kan ik het autonomie geven over mijn sms-berichten en is dat veilig?">
    We raden volledige autonomie over je persoonlijke berichten **niet** aan. Het veiligste patroon is:

    - Houd privéberichten in **koppelmodus** of een strikte allowlist.
    - Gebruik een **apart nummer of account** als je wilt dat het namens jou berichten verstuurt.
    - Laat het een concept maken en **keur het goed voordat het wordt verzonden**.

    Als je wilt experimenteren, doe dat dan met een speciaal account en houd het geïsoleerd. Zie
    [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Kan ik goedkopere modellen gebruiken voor taken van een persoonlijke assistent?">
    Ja, **als** de agent alleen chat gebruikt en de invoer vertrouwd is. Kleinere niveaus zijn
    gevoeliger voor instructie-overname, dus vermijd ze voor agents met ingeschakelde tools
    of bij het lezen van niet-vertrouwde inhoud. Als je een kleiner model moet gebruiken, vergrendel dan
    tools en voer het uit in een sandbox. Zie [Beveiliging](/nl/gateway/security).
  </Accordion>

  <Accordion title="Ik heb /start uitgevoerd in Telegram maar kreeg geen koppelcode">
    Koppelcodes worden **alleen** verzonden wanneer een onbekende afzender de bot een bericht stuurt en
    `dmPolicy: "pairing"` is ingeschakeld. `/start` genereert op zichzelf geen code.

    Controleer openstaande verzoeken:

    ```bash
    openclaw pairing list telegram
    ```

    Als je directe toegang wilt, voeg je afzender-id toe aan de allowlist of stel `dmPolicy: "open"`
    in voor dat account.

  </Accordion>

  <Accordion title="WhatsApp: stuurt het berichten naar mijn contacten? Hoe werkt koppelen?">
    Nee. Het standaard WhatsApp-beleid voor privéberichten is **koppelen**. Onbekende afzenders krijgen alleen een koppelcode en hun bericht wordt **niet verwerkt**. OpenClaw reageert alleen op chats die het ontvangt of op expliciete verzendacties die jij start.

    Keur koppelen goed met:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Toon openstaande verzoeken:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt voor telefoonnummer in de wizard: dit wordt gebruikt om je **allowlist/eigenaar** in te stellen, zodat je eigen privéberichten zijn toegestaan. Het wordt niet gebruikt voor automatisch verzenden. Als je je persoonlijke WhatsApp-nummer gebruikt, gebruik dan dat nummer en schakel `channels.whatsapp.selfChatMode` in.

  </Accordion>
</AccordionGroup>

## Chatopdrachten, taken afbreken en "het stopt niet"

<AccordionGroup>
  <Accordion title="Hoe voorkom ik dat interne systeemberichten in de chat verschijnen?">
    De meeste interne berichten of toolberichten verschijnen alleen wanneer **uitgebreid**, **trace** of **reasoning** is ingeschakeld
    voor die sessie.

    Los dit op in de chat waar je het ziet:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Als het nog steeds te veel ruis geeft, controleer dan de sessie-instellingen in de Control UI en stel uitgebreid
    in op **overnemen**. Controleer ook of je geen botprofiel gebruikt waarbij `verboseDefault` in de configuratie
    op `on` staat.

    Docs: [Denken en uitgebreide uitvoer](/nl/tools/thinking), [Beveiliging](/nl/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Hoe stop/annuleer ik een lopende taak?">
    Verstuur een van deze **als zelfstandig bericht** (geen slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Dit zijn afbreektriggers (geen slash-opdrachten).

    Voor achtergrondprocessen (vanuit de exec-tool) kun je de agent vragen om uit te voeren:

    ```
    process action:kill sessionId:XXX
    ```

    Overzicht van slash-opdrachten: zie [Slash-opdrachten](/nl/tools/slash-commands).

    De meeste opdrachten moeten worden verzonden als een **zelfstandig** bericht dat begint met `/`, maar een paar snelkoppelingen (zoals `/status`) werken ook inline voor afzenders op de allowlist.

  </Accordion>

  <Accordion title='Hoe stuur ik een Discord-bericht vanuit Telegram? ("Berichten tussen contexten geweigerd")'>
    OpenClaw blokkeert standaard berichten tussen **providers**. Als een toolaanroep is gebonden
    aan Telegram, verzendt die niet naar Discord tenzij je dit expliciet toestaat.

    Schakel berichten tussen providers in voor de agent:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Start de Gateway opnieuw na het bewerken van de configuratie.

  </Accordion>

  <Accordion title='Waarom voelt het alsof de bot snelle opeenvolgende berichten "negeert"?'>
    Prompts tijdens een lopende run worden standaard naar de actieve run gestuurd. Gebruik `/queue` om het gedrag van de actieve run te kiezen:

    - `steer` - stuur de actieve run bij de volgende modelgrens
    - `followup` - zet berichten in de wachtrij en voer ze één voor één uit nadat de huidige run eindigt
    - `collect` - zet compatibele berichten in de wachtrij en antwoord één keer nadat de huidige run eindigt
    - `interrupt` - breek de huidige run af en start opnieuw

    De standaardmodus is `steer`. Je kunt opties toevoegen zoals `debounce:0.5s cap:25 drop:summarize` voor wachtrijmodi. Zie [Opdrachtwachtrij](/nl/concepts/queue) en [Stuurwachtrij](/nl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Diversen

<AccordionGroup>
  <Accordion title='Wat is het standaardmodel voor Anthropic met een API-sleutel?'>
    In OpenClaw staan referenties en modelselectie los van elkaar. Door `ANTHROPIC_API_KEY` in te stellen (of een Anthropic API-sleutel op te slaan in auth-profielen) schakel je authenticatie in, maar het daadwerkelijke standaardmodel is wat je configureert in `agents.defaults.model.primary` (bijvoorbeeld `anthropic/claude-sonnet-4-6` of `anthropic/claude-opus-4-6`). Als je `No credentials found for profile "anthropic:default"` ziet, betekent dit dat de Gateway geen Anthropic-referenties kon vinden in het verwachte `auth-profiles.json` voor de agent die wordt uitgevoerd.
  </Accordion>
</AccordionGroup>

---

Nog steeds vastgelopen? Vraag het in [Discord](https://discord.com/invite/clawd) of open een [GitHub-discussie](https://github.com/openclaw/openclaw/discussions).

## Gerelateerd

- [FAQ eerste run](/nl/help/faq-first-run) — installatie, onboarden, auth, abonnementen, vroege fouten
- [FAQ modellen](/nl/help/faq-models) — modelselectie, failover, auth-profielen
- [Probleemoplossing](/nl/help/troubleshooting) — triage op basis van symptomen
