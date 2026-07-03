---
read_when:
    - Veelvoorkomende ondersteuningsvragen over configuratie, installatie, onboarding of runtime beantwoorden
    - Problemen die door gebruikers zijn gemeld triëren vóór diepere foutopsporing
summary: Veelgestelde vragen over installatie, configuratie en gebruik van OpenClaw
title: Veelgestelde vragen
x-i18n:
    generated_at: "2026-07-03T15:34:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

Snelle antwoorden plus diepere probleemoplossing voor praktijksituaties (lokale ontwikkeling, VPS, multi-agent, OAuth/API-sleutels, model-failover). Zie [Probleemoplossing](/nl/gateway/troubleshooting) voor runtimediagnostiek. Zie [Configuratie](/nl/gateway/configuration) voor de volledige configuratiereferentie.

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

   Alleen-lezen diagnose met logtail (tokens geredigeerd).

3. **Daemon- en poortstatus**

   ```bash
   openclaw gateway status
   ```

   Toont supervisor-runtime versus RPC-bereikbaarheid, de doel-URL van de probe en welke configuratie de service waarschijnlijk heeft gebruikt.

4. **Diepe probes**

   ```bash
   openclaw status --deep
   ```

   Voert een live gezondheidsprobe van de Gateway uit, inclusief kanaalprobes wanneer ondersteund
   (vereist een bereikbare Gateway). Zie [Gezondheid](/nl/gateway/health).

5. **Tail het nieuwste log**

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
   openclaw health --verbose   # toont de doel-URL + het configuratiepad bij fouten
   ```

   Vraagt de actieve Gateway om een volledige snapshot (alleen WS). Zie [Gezondheid](/nl/gateway/health).

## Snel starten en setup bij eerste gebruik

Vraag en antwoord voor eerste gebruik — installatie, onboarding, authenticatieroutes, abonnementen, eerste fouten —
staat in de [FAQ voor eerste gebruik](/nl/help/faq-first-run).

## Wat is OpenClaw?

<AccordionGroup>
  <Accordion title="Wat is OpenClaw, in één alinea?">
    OpenClaw is een persoonlijke AI-assistent die je op je eigen apparaten draait. Hij antwoordt op de berichtendiensten die je al gebruikt (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat en gebundelde kanaalplugins zoals QQ Bot) en kan op ondersteunde platforms ook spraak + een live Canvas gebruiken. De **Gateway** is de altijd actieve besturingslaag; de assistent is het product.
  </Accordion>

  <Accordion title="Waardepropositie">
    OpenClaw is niet "gewoon een Claude-wrapper." Het is een **local-first besturingslaag** waarmee je een
    capabele assistent op **je eigen hardware** draait, bereikbaar vanuit de chat-apps die je al gebruikt, met
    stateful sessies, geheugen en tools - zonder de controle over je workflows over te dragen aan een gehoste
    SaaS.

    Hoogtepunten:

    - **Jouw apparaten, jouw data:** draai de Gateway waar je wilt (Mac, Linux, VPS) en houd de
      workspace + sessiegeschiedenis lokaal.
    - **Echte kanalen, geen web-sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/enz.,
      plus mobiele spraak en Canvas op ondersteunde platforms.
    - **Model-agnostisch:** gebruik Anthropic, OpenAI, MiniMax, OpenRouter, enz., met routering
      per agent en failover.
    - **Optie voor alleen lokaal:** draai lokale modellen zodat **alle data op je apparaat kan blijven** als je dat wilt.
    - **Multi-agentroutering:** aparte agents per kanaal, account of taak, elk met een eigen
      workspace en standaarden.
    - **Open source en aanpasbaar:** inspecteer, breid uit en self-host zonder vendor lock-in.

    Documentatie: [Gateway](/nl/gateway), [Kanalen](/nl/channels), [Multi-agent](/nl/concepts/multi-agent),
    [Geheugen](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Ik heb het net ingesteld - wat moet ik eerst doen?">
    Goede eerste projecten:

    - Bouw een website (WordPress, Shopify of een eenvoudige statische site).
    - Maak een prototype van een mobiele app (outline, schermen, API-plan).
    - Organiseer bestanden en mappen (opschonen, naamgeving, taggen).
    - Verbind Gmail en automatiseer samenvattingen of follow-ups.

    Het kan grote taken aan, maar werkt het best wanneer je ze in fases splitst en
    subagents gebruikt voor parallel werk.

  </Accordion>

  <Accordion title="Wat zijn de vijf belangrijkste dagelijkse gebruiksscenario's voor OpenClaw?">
    Dagelijkse winst ziet er meestal zo uit:

    - **Persoonlijke briefings:** samenvattingen van inbox, agenda en nieuws dat je belangrijk vindt.
    - **Onderzoek en conceptteksten:** snel onderzoek, samenvattingen en eerste concepten voor e-mails of documenten.
    - **Herinneringen en follow-ups:** door Cron of Heartbeat aangestuurde duwtjes en checklists.
    - **Browserautomatisering:** formulieren invullen, data verzamelen en webtaken herhalen.
    - **Coördinatie tussen apparaten:** stuur een taak vanaf je telefoon, laat de Gateway die op een server uitvoeren en ontvang het resultaat terug in chat.

  </Accordion>

  <Accordion title="Kan OpenClaw helpen met leadgeneratie, outreach, advertenties en blogs voor een SaaS?">
    Ja, voor **onderzoek, kwalificatie en concepten**. Het kan sites scannen, shortlists maken,
    prospects samenvatten en concepten schrijven voor outreach of advertentieteksten.

    Houd bij **outreach of advertentieruns** een mens in de loop. Vermijd spam, volg lokale wetten en
    platformbeleid, en controleer alles voordat het wordt verzonden. Het veiligste patroon is om
    OpenClaw te laten opstellen en jou te laten goedkeuren.

    Documentatie: [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Wat zijn de voordelen ten opzichte van Claude Code voor webontwikkeling?">
    OpenClaw is een **persoonlijke assistent** en coördinatielaag, geen vervanging voor een IDE. Gebruik
    Claude Code of Codex voor de snelste directe coding-loop binnen een repo. Gebruik OpenClaw wanneer je
    duurzaam geheugen, toegang vanaf meerdere apparaten en toolorkestratie wilt.

    Voordelen:

    - **Persistent geheugen + workspace** over sessies heen
    - **Toegang vanaf meerdere platforms** (WhatsApp, Telegram, TUI, WebChat)
    - **Toolorkestratie** (browser, bestanden, planning, hooks)
    - **Altijd actieve Gateway** (draai op een VPS, werk vanaf overal)
    - **Nodes** voor lokale browser/scherm/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills en automatisering

<AccordionGroup>
  <Accordion title="Hoe pas ik Skills aan zonder de repo vuil te houden?">
    Gebruik beheerde overrides in plaats van de repo-kopie te bewerken. Zet je wijzigingen in `~/.openclaw/skills/<name>/SKILL.md` (of voeg een map toe via `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). De volgorde van prioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebundeld → `skills.load.extraDirs`, dus beheerde overrides winnen nog steeds van gebundelde Skills zonder git aan te raken. Als je de Skill globaal geïnstalleerd nodig hebt, maar alleen zichtbaar voor sommige agents, houd de gedeelde kopie dan in `~/.openclaw/skills` en regel zichtbaarheid met `agents.defaults.skills` en `agents.list[].skills`. Alleen wijzigingen die upstream waard zijn, horen in de repo te staan en als PRs uit te gaan.
  </Accordion>

  <Accordion title="Kan ik Skills laden vanuit een aangepaste map?">
    Ja. Voeg extra mappen toe via `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (laagste prioriteit). De standaardvolgorde van prioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebundeld → `skills.load.extraDirs`. `clawhub` installeert standaard in `./skills`, wat OpenClaw in de volgende sessie behandelt als `<workspace>/skills`. Als de Skill alleen zichtbaar moet zijn voor bepaalde agents, combineer dat dan met `agents.defaults.skills` of `agents.list[].skills`.
  </Accordion>

  <Accordion title="Hoe kan ik verschillende modellen of instellingen gebruiken voor verschillende taken?">
    Vandaag zijn dit de ondersteunde patronen:

    - **Cron-taken**: geïsoleerde taken kunnen per taak een `model`-override instellen.
    - **Agents**: routeer taken naar aparte agents met verschillende standaardmodellen, denkniveaus en streamparameters.
    - **Schakelaar op aanvraag**: gebruik `/model` om op elk moment het model van de huidige sessie te wisselen.

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

    Zet gedeelde standaarden per model in `agents.defaults.models["provider/model"].params` en zet agentspecifieke overrides daarna in platte `agents.list[].params`. Definieer geen aparte geneste `agents.list[].models["provider/model"].params`-items voor hetzelfde model; `agents.list[].models` is bedoeld voor de modelcatalogus en runtime-overrides per agent.

    Zie [Cron-taken](/nl/automation/cron-jobs), [Multi-agentroutering](/nl/concepts/multi-agent), [Configuratie](/nl/gateway/config-agents) en [Slash-commando's](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="De bot bevriest tijdens zwaar werk. Hoe laad ik dat uit?">
    Gebruik **subagents** voor lange of parallelle taken. Subagents draaien in hun eigen sessie,
    geven een samenvatting terug en houden je hoofdchat responsief.

    Vraag je bot om "spawn a sub-agent for this task" of gebruik `/subagents`.
    Gebruik `/status` in chat om te zien wat de Gateway op dit moment doet (en of die bezig is).

    Tokentip: lange taken en subagents verbruiken allebei tokens. Als kosten een punt zijn, stel dan een
    goedkoper model in voor subagents via `agents.defaults.subagents.model`.

    Documentatie: [Subagents](/nl/tools/subagents), [Achtergrondtaken](/nl/automation/tasks).

  </Accordion>

  <Accordion title="Hoe werken thread-gebonden subagentsessies op Discord?">
    Gebruik threadbindingen. Je kunt een Discord-thread binden aan een subagent- of sessiedoel, zodat vervolgberichten in die thread op die gebonden sessie blijven.

    Basisflow:

    - Spawn met `sessions_spawn` met `thread: true` (en optioneel `mode: "session"` voor persistente follow-up).
    - Of bind handmatig met `/focus <target>`.
    - Gebruik `/agents` om de bindingsstatus te bekijken.
    - Gebruik `/session idle <duration|off>` en `/session max-age <duration|off>` om automatisch ontfocussen te beheren.
    - Gebruik `/unfocus` om de thread los te koppelen.

    Vereiste configuratie:

    - Globale standaarden: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisch binden bij spawn: `channels.discord.threadBindings.spawnSessions` is standaard `true`; zet dit op `false` om thread-gebonden sessiespawns uit te schakelen.

    Documentatie: [Subagents](/nl/tools/subagents), [Discord](/nl/channels/discord), [Configuratiereferentie](/nl/gateway/configuration-reference), [Slash-commando's](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Een subagent is klaar, maar de voltooiingsupdate ging naar de verkeerde plek of werd nooit geplaatst. Wat moet ik controleren?">
    Controleer eerst de opgeloste route van de aanvrager:

    - Levering van subagents in voltooiingsmodus geeft de voorkeur aan elke gebonden thread- of conversatieroute wanneer die bestaat.
    - Als de voltooiingsoorsprong alleen een kanaal bevat, valt OpenClaw terug op de opgeslagen route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe levering nog steeds kan slagen.
    - Als er geen gebonden route en ook geen bruikbare opgeslagen route bestaat, kan directe levering mislukken en valt het resultaat terug op levering via de wachtrij van de sessie in plaats van direct in chat te plaatsen.
    - Ongeldige of verouderde doelen kunnen nog steeds een terugval naar de wachtrij of een uiteindelijke leveringsfout afdwingen.
    - Als het laatste zichtbare assistentantwoord van het child exact het stille token `NO_REPLY` / `no_reply` is, of exact `ANNOUNCE_SKIP`, onderdrukt OpenClaw de aankondiging bewust in plaats van eerdere verouderde voortgang te plaatsen.
    - Tool-/toolResult-uitvoer wordt niet gepromoveerd naar resultaattekst van het child; het resultaat is het nieuwste zichtbare assistentantwoord van het child.

    Debuggen:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentatie: [Subagenten](/nl/tools/subagents), [Achtergrondtaken](/nl/automation/tasks), [Sessietools](/nl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron of herinneringen worden niet uitgevoerd. Wat moet ik controleren?">
    Cron draait binnen het Gateway-proces. Als de Gateway niet continu draait,
    worden geplande taken niet uitgevoerd.

    Checklist:

    - Controleer of cron is ingeschakeld (`cron.enabled`) en `OPENCLAW_SKIP_CRON` niet is ingesteld.
    - Controleer of de Gateway 24/7 draait (geen slaapstand/herstarts).
    - Controleer de tijdzone-instellingen voor de taak (`--tz` versus de tijdzone van de host).

    Debuggen:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentatie: [Cron-taken](/nl/automation/cron-jobs), [Automatisering](/nl/automation).

  </Accordion>

  <Accordion title="Cron is uitgevoerd, maar er is niets naar het kanaal verzonden. Waarom?">
    Controleer eerst de aflevermodus:

    - `--no-deliver` / `delivery.mode: "none"` betekent dat er geen fallback-verzending door de runner wordt verwacht.
    - Een ontbrekend of ongeldig aankondigingsdoel (`channel` / `to`) betekent dat de runner uitgaande aflevering heeft overgeslagen.
    - Kanaal-authenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat de runner probeerde af te leveren, maar dat de referenties dit blokkeerden.
    - Een stil geïsoleerd resultaat (alleen `NO_REPLY` / `no_reply`) wordt behandeld als bewust niet-afleverbaar, dus onderdrukt de runner ook wachtrij-fallbackaflevering.

    Voor geïsoleerde Cron-taken kan de agent nog steeds rechtstreeks verzenden met de `message`-
    tool wanneer er een chatroute beschikbaar is. `--announce` regelt alleen het runner-
    fallbackpad voor definitieve tekst die de agent nog niet had verzonden.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentatie: [Cron-taken](/nl/automation/cron-jobs), [Achtergrondtaken](/nl/automation/tasks).

  </Accordion>

  <Accordion title="Waarom schakelde een geïsoleerde Cron-run van model of probeerde die het één keer opnieuw?">
    Dat is meestal het live model-switchpad, geen dubbele planning.

    Geïsoleerde Cron kan een runtime-modeloverdracht persistent maken en opnieuw proberen wanneer de actieve
    run `LiveSessionModelSwitchError` werpt. De nieuwe poging behoudt de overgeschakelde
    provider/het overgeschakelde model, en als de switch een nieuwe auth-profieloverschrijving bevatte, maakt Cron
    die ook persistent voordat opnieuw wordt geprobeerd.

    Gerelateerde selectieregels:

    - Gmail-hookmodeloverschrijving wint als eerste wanneer van toepassing.
    - Daarna `model` per taak.
    - Daarna elke opgeslagen modeloverschrijving voor de Cron-sessie.
    - Daarna de normale agent-/standaardmodelselectie.

    De retry-lus is begrensd. Na de eerste poging plus 2 switch-retries
    breekt Cron af in plaats van eindeloos te blijven lopen.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentatie: [Cron-taken](/nl/automation/cron-jobs), [Cron-CLI](/nl/cli/cron).

  </Accordion>

  <Accordion title="Hoe installeer ik Skills op Linux?">
    Gebruik native `openclaw skills`-commando's of plaats Skills in je werkruimte. De macOS Skills-UI is niet beschikbaar op Linux.
    Bekijk Skills op [https://clawhub.ai](https://clawhub.ai).

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

    Native `openclaw skills install` schrijft standaard naar de actieve werkruimte-directory `skills/`.
    Voeg `--global` toe om te installeren in de gedeelde beheerde
    Skills-directory voor alle lokale agents. Installeer de afzonderlijke `clawhub`-CLI
    alleen als je je eigen Skills wilt publiceren of synchroniseren. Gebruik
    `agents.defaults.skills` of `agents.list[].skills` als je wilt beperken
    welke agents gedeelde Skills kunnen zien.

  </Accordion>

  <Accordion title="Kan OpenClaw taken volgens een schema of continu op de achtergrond uitvoeren?">
    Ja. Gebruik de Gateway-planner:

    - **Cron-taken** voor geplande of terugkerende taken (blijven behouden na herstarts).
    - **Heartbeat** voor periodieke controles van de "hoofdsessie".
    - **Geïsoleerde taken** voor autonome agents die samenvattingen plaatsen of naar chats afleveren.

    Documentatie: [Cron-taken](/nl/automation/cron-jobs), [Automatisering](/nl/automation),
    [Heartbeat](/nl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kan ik Apple macOS-only Skills vanaf Linux uitvoeren?">
    Niet rechtstreeks. macOS-Skills worden beperkt door `metadata.openclaw.os` plus vereiste binaries, en Skills verschijnen alleen in de systeemprompt wanneer ze geschikt zijn op de **Gateway-host**. Op Linux worden `darwin`-only Skills (zoals `apple-notes`, `apple-reminders`, `things-mac`) niet geladen tenzij je de gating overschrijft.

    Je hebt drie ondersteunde patronen:

    **Optie A - voer de Gateway uit op een Mac (het eenvoudigst).**
    Voer de Gateway uit waar de macOS-binaries bestaan en maak daarna vanaf Linux verbinding in [remote mode](#gateway-ports-already-running-and-remote-mode) of via Tailscale. De Skills laden normaal omdat de Gateway-host macOS is.

    **Optie B - gebruik een macOS-Node (geen SSH).**
    Voer de Gateway uit op Linux, koppel een macOS-Node (menubalk-app) en stel **Node Run Commands** op de Mac in op "Always Ask" of "Always Allow". OpenClaw kan macOS-only Skills als geschikt behandelen wanneer de vereiste binaries op de Node bestaan. De agent voert die Skills uit via de `nodes`-tool. Als je "Always Ask" kiest, voegt goedkeuring van "Always Allow" in de prompt dat commando toe aan de allowlist.

    **Optie C - proxy macOS-binaries via SSH (geavanceerd).**
    Houd de Gateway op Linux, maar laat de vereiste CLI-binaries verwijzen naar SSH-wrappers die op een Mac draaien. Overschrijf daarna de Skill om Linux toe te staan, zodat deze geschikt blijft.

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
    Vandaag niet ingebouwd.

    Opties:

    - **Aangepaste Skill / Plugin:** het beste voor betrouwbare API-toegang (Notion/HeyGen hebben allebei API's).
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

    Native installaties komen terecht in de actieve werkruimte-directory `skills/`. Gebruik `openclaw skills install @owner/<skill-slug> --global` voor gedeelde Skills voor alle lokale agents (of plaats ze handmatig in `~/.openclaw/skills/<name>/SKILL.md`). Als slechts sommige agents een gedeelde installatie mogen zien, configureer dan `agents.defaults.skills` of `agents.list[].skills`. Sommige Skills verwachten binaries die via Homebrew zijn geïnstalleerd; op Linux betekent dat Linuxbrew (zie de Homebrew Linux FAQ-vermelding hierboven). Zie [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config) en [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Hoe gebruik ik mijn bestaande aangemelde Chrome met OpenClaw?">
    Gebruik het ingebouwde `user`-browserprofiel, dat koppelt via Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Als je een aangepaste naam wilt, maak dan een expliciet MCP-profiel:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dit pad kan de lokale hostbrowser of een verbonden browser-Node gebruiken. Als de Gateway ergens anders draait, voer dan een Node-host uit op de browsermachine of gebruik in plaats daarvan remote CDP.

    Huidige beperkingen voor `existing-session` / `user`:

    - acties zijn ref-gestuurd, niet CSS-selector-gestuurd
    - uploads vereisen `ref` / `inputRef` en ondersteunen momenteel één bestand tegelijk
    - `responsebody`, PDF-export, downloadonderschepping en batchacties hebben nog steeds een beheerde browser of raw CDP-profiel nodig

  </Accordion>
</AccordionGroup>

## Sandboxing en geheugen

<AccordionGroup>
  <Accordion title="Is er een specifieke documentatiepagina voor sandboxing?">
    Ja. Zie [Sandboxing](/nl/gateway/sandboxing). Voor Docker-specifieke setup (volledige Gateway in Docker of sandbox-images), zie [Docker](/nl/install/docker).
  </Accordion>

  <Accordion title="Docker voelt beperkt - hoe schakel ik volledige functies in?">
    De standaardimage zet beveiliging voorop en draait als de `node`-gebruiker, waardoor deze geen
    systeempakketten, Homebrew of gebundelde browsers bevat. Voor een vollere setup:

    - Maak `/home/node` persistent met `OPENCLAW_HOME_VOLUME` zodat caches behouden blijven.
    - Bak systeemafhankelijkheden in de image met `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Installeer Playwright-browsers via de gebundelde CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Stel `PLAYWRIGHT_BROWSERS_PATH` in en zorg dat het pad persistent is.

    Documentatie: [Docker](/nl/install/docker), [Browser](/nl/tools/browser).

  </Accordion>

  <Accordion title="Kan ik DM's persoonlijk houden maar groepen openbaar/gesandboxed maken met één agent?">
    Ja - als je privéverkeer **DM's** is en je openbare verkeer **groepen**.

    Gebruik `agents.defaults.sandbox.mode: "non-main"` zodat groeps-/kanaalsessies (niet-main-sleutels) in de geconfigureerde sandbox-backend draaien, terwijl de hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest. Beperk daarna welke tools beschikbaar zijn in gesandboxte sessies via `tools.sandbox.tools`.

    Setup-walkthrough + voorbeeldconfiguratie: [Groepen: persoonlijke DM's + openbare groepen](/nl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Belangrijke configuratiereferentie: [Gateway-configuratie](/nl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Hoe bind ik een hostmap in de sandbox?">
    Stel `agents.defaults.sandbox.docker.binds` in op `["host:path:mode"]` (bijv. `"/home/user/src:/src:ro"`). Globale en per-agent binds worden samengevoegd; per-agent binds worden genegeerd wanneer `scope: "shared"` is. Gebruik `:ro` voor alles wat gevoelig is en onthoud dat binds de muren van het sandbox-bestandssysteem omzeilen.

    OpenClaw valideert bind-bronnen tegen zowel het genormaliseerde pad als het canonieke pad dat via de diepste bestaande ancestor wordt opgelost. Dat betekent dat symlink-parent-ontsnappingen nog steeds gesloten falen, zelfs wanneer het laatste padsegment nog niet bestaat, en allowed-root-controles nog steeds gelden na symlink-resolutie.

    Zie [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts) en [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) voor voorbeelden en veiligheidsnotities.

  </Accordion>

  <Accordion title="Hoe werkt geheugen?">
    OpenClaw-geheugen bestaat gewoon uit Markdown-bestanden in de agent-werkruimte:

    - Dagelijkse notities in `memory/YYYY-MM-DD.md`
    - Gecureerde langetermijnnotities in `MEMORY.md` (alleen main-/privésessies)

    OpenClaw voert ook een **stille pre-Compaction-geheugenflush** uit om het model eraan te herinneren
    duurzame notities te schrijven vóór automatische Compaction. Dit draait alleen wanneer de werkruimte
    beschrijfbaar is (read-only sandboxes slaan dit over). Zie [Geheugen](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Memory blijft dingen vergeten. Hoe zorg ik dat het blijft hangen?">
    Vraag de bot om **het feit naar memory te schrijven**. Langetermijnnotities horen in `MEMORY.md`,
    kortetermijncontext gaat naar `memory/YYYY-MM-DD.md`.

    Dit is nog steeds een gebied dat we verbeteren. Het helpt om het model eraan te herinneren memories op te slaan;
    het weet wat het moet doen. Als het dingen blijft vergeten, controleer dan of de Gateway bij elke run dezelfde
    workspace gebruikt.

    Documentatie: [Memory](/nl/concepts/memory), [Agent-workspace](/nl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Blijft memory voor altijd bestaan? Wat zijn de limieten?">
    Memory-bestanden staan op schijf en blijven bestaan totdat je ze verwijdert. De limiet is je
    opslagruimte, niet het model. De **sessiecontext** wordt nog steeds beperkt door het contextvenster
    van het model, dus lange gesprekken kunnen worden gecompacteerd of afgekapt. Daarom bestaat
    memory-zoeken: het haalt alleen de relevante delen terug in de context.

    Documentatie: [Memory](/nl/concepts/memory), [Context](/nl/concepts/context).

  </Accordion>

  <Accordion title="Vereist semantisch memory-zoeken een OpenAI API-sleutel?">
    Alleen als je **OpenAI-embeddings** gebruikt. Codex OAuth dekt chat/completions en
    geeft **geen** toegang tot embeddings, dus **inloggen met Codex (OAuth of de
    Codex CLI-login)** helpt niet voor semantisch memory-zoeken. OpenAI-embeddings
    hebben nog steeds een echte API-sleutel nodig (`OPENAI_API_KEY` of `models.providers.openai.apiKey`).

    Als je geen provider expliciet instelt, gebruikt OpenClaw OpenAI-embeddings. Verouderde
    configuraties waarin nog `memorySearch.provider = "auto"` staat, worden ook naar OpenAI opgelost.
    Als er geen OpenAI API-sleutel beschikbaar is, blijft semantisch memory-zoeken niet beschikbaar
    totdat je een sleutel configureert of expliciet een andere provider kiest.

    Als je liever lokaal blijft, stel dan `memorySearch.provider = "local"` in (en eventueel
    `memorySearch.fallback = "none"`). Als je Gemini-embeddings wilt, stel dan
    `memorySearch.provider = "gemini"` in en geef `GEMINI_API_KEY` op (of
    `memorySearch.remote.apiKey`). We ondersteunen **OpenAI-, OpenAI-compatibele, Gemini-,
    Voyage-, Mistral-, Bedrock-, Ollama-, LM Studio-, GitHub Copilot-, DeepInfra- of lokale**
    embeddingmodellen; zie [Memory](/nl/concepts/memory) voor de installatiegegevens.

  </Accordion>
</AccordionGroup>

## Waar dingen op schijf staan

<AccordionGroup>
  <Accordion title="Worden alle gegevens die met OpenClaw worden gebruikt lokaal opgeslagen?">
    Nee: **de status van OpenClaw is lokaal**, maar **externe services zien nog steeds wat je naar ze stuurt**.

    - **Standaard lokaal:** sessies, memory-bestanden, configuratie en workspace staan op de Gateway-host
      (`~/.openclaw` + je workspace-directory).
    - **Noodzakelijk extern:** berichten die je naar modelproviders (Anthropic/OpenAI/enz.) stuurt, gaan naar
      hun API's, en chatplatforms (WhatsApp/Telegram/Slack/enz.) slaan berichtgegevens op hun
      servers op.
    - **Jij beheert de footprint:** met lokale modellen blijven prompts op je machine, maar channelverkeer
      gaat nog steeds via de servers van het channel.

    Gerelateerd: [Agent-workspace](/nl/concepts/agent-workspace), [Memory](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Waar slaat OpenClaw zijn gegevens op?">
    Alles staat onder `$OPENCLAW_STATE_DIR` (standaard: `~/.openclaw`):

    | Pad                                                             | Doel                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hoofdconfiguratie (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Verouderde OAuth-import (bij eerste gebruik gekopieerd naar auth-profielen) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-profielen (OAuth, API-sleutels en optionele `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionele bestandsgebaseerde geheime payload voor `file` SecretRef-providers |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Verouderd compatibiliteitsbestand (statische `api_key`-vermeldingen opgeschoond) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Providerstatus (bijv. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Status per agent (agentDir + sessies)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Gespreksgeschiedenis en status (per agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sessiemetadata (per agent)                                         |

    Verouderd pad voor één agent: `~/.openclaw/agent/*` (gemigreerd door `openclaw doctor`).

    Je **workspace** (AGENTS.md, memory-bestanden, skills, enz.) staat apart en wordt geconfigureerd via `agents.defaults.workspace` (standaard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Waar moeten AGENTS.md / SOUL.md / USER.md / MEMORY.md staan?">
    Deze bestanden staan in de **agent-workspace**, niet in `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optioneel `HEARTBEAT.md`.
      De lowercase root `memory.md` is alleen verouderde reparatie-invoer; `openclaw doctor --fix`
      kan het samenvoegen in `MEMORY.md` wanneer beide bestanden bestaan.
    - **Statusdirectory (`~/.openclaw`)**: configuratie, channel-/providerstatus, auth-profielen, sessies, logs,
      en gedeelde Skills (`~/.openclaw/skills`).

    De standaardworkspace is `~/.openclaw/workspace`, configureerbaar via:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Als de bot na een herstart "vergeet", bevestig dan dat de Gateway bij elke start dezelfde
    workspace gebruikt (en onthoud: externe modus gebruikt de **workspace van de gateway-host**,
    niet je lokale laptop).

    Tip: als je duurzaam gedrag of een duurzame voorkeur wilt, vraag de bot dan om het **naar
    AGENTS.md of MEMORY.md te schrijven** in plaats van te vertrouwen op chatgeschiedenis.

    Zie [Agent-workspace](/nl/concepts/agent-workspace) en [Memory](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Kan ik SOUL.md groter maken?">
    Ja. `SOUL.md` is een van de workspace-bootstrapbestanden die in de
    agentcontext worden geïnjecteerd. De standaard injectielimiet per bestand is `20000` tekens,
    en het totale bootstrapbudget over bestanden heen is `60000` tekens.

    Wijzig de gedeelde standaardwaarden in je OpenClaw-configuratie:

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

    Gebruik `/context` om ruwe versus geïnjecteerde groottes te controleren en of er afkapping heeft plaatsgevonden.
    Houd `SOUL.md` gericht op stem, houding en persoonlijkheid; zet operationele regels
    in `AGENTS.md` en duurzame feiten in memory.

    Zie [Context](/nl/concepts/context) en [Agentconfiguratie](/nl/gateway/config-agents).

  </Accordion>

  <Accordion title="Aanbevolen back-upstrategie">
    Zet je **agent-workspace** in een **private** git-repo en maak er ergens
    privé een back-up van (bijvoorbeeld GitHub private). Dit legt memory + AGENTS/SOUL/USER-
    bestanden vast, en laat je later de "geest" van de assistent herstellen.

    Commit **niets** onder `~/.openclaw` (referenties, sessies, tokens of versleutelde geheime payloads).
    Als je een volledig herstel nodig hebt, maak dan afzonderlijk een back-up van zowel de workspace als de statusdirectory
    (zie de migratievraag hierboven).

    Documentatie: [Agent-workspace](/nl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Hoe verwijder ik OpenClaw volledig?">
    Zie de specifieke handleiding: [Verwijderen](/nl/install/uninstall).
  </Accordion>

  <Accordion title="Kunnen agents buiten de workspace werken?">
    Ja. De workspace is de **standaard cwd** en memory-anker, geen harde sandbox.
    Relatieve paden worden binnen de workspace opgelost, maar absolute paden kunnen andere
    hostlocaties openen tenzij sandboxing is ingeschakeld. Als je isolatie nodig hebt, gebruik dan
    [`agents.defaults.sandbox`](/nl/gateway/sandboxing) of sandboxinstellingen per agent. Als je
    wilt dat een repo de standaardwerkdirectory is, wijs de `workspace` van die agent
    naar de repo-root. De OpenClaw-repo is alleen broncode; houd de
    workspace apart tenzij je bewust wilt dat de agent erin werkt.

    Voorbeeld (repo als standaard cwd):

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
    Sessiestatus is eigendom van de **gateway-host**. Als je in externe modus werkt, staat de sessieopslag die voor jou relevant is op de externe machine, niet op je lokale laptop. Zie [Sessiebeheer](/nl/concepts/session).
  </Accordion>
</AccordionGroup>

## Basisconfiguratie

<AccordionGroup>
  <Accordion title="Welk formaat heeft de configuratie? Waar staat die?">
    OpenClaw leest een optionele **JSON5**-configuratie uit `$OPENCLAW_CONFIG_PATH` (standaard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Als het bestand ontbreekt, gebruikt het redelijk veilige standaardwaarden (waaronder een standaardworkspace van `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ik heb gateway.bind ingesteld op "lan" (of "tailnet") en nu luistert er niets / de UI zegt unauthorized'>
    Niet-loopback-binds **vereisen een geldig gateway-auth-pad**. In de praktijk betekent dat:

    - shared-secret-auth: token of wachtwoord
    - `gateway.auth.mode: "trusted-proxy"` achter een correct geconfigureerde identity-aware reverse proxy

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

    - `gateway.remote.token` / `.password` schakelen lokale gateway-auth **niet** zelfstandig in.
    - Lokale call-paden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
    - Stel voor wachtwoordauth in plaats daarvan `gateway.auth.mode: "password"` plus `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`) in.
    - Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt resolutie gesloten (geen remote fallback die dit maskeert).
    - Shared-secret Control UI-setups authenticeren via `connect.params.auth.token` of `connect.params.auth.password` (opgeslagen in app-/UI-instellingen). Modi met identiteit, zoals Tailscale Serve of `trusted-proxy`, gebruiken in plaats daarvan requestheaders. Vermijd gedeelde geheimen in URL's.
    - Met `gateway.auth.mode: "trusted-proxy"` vereisen same-host loopback reverse proxies expliciet `gateway.auth.trustedProxy.allowLoopback = true` en een loopback-vermelding in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Waarom heb ik nu een token nodig op localhost?">
    OpenClaw dwingt standaard gateway-auth af, inclusief loopback. In het normale standaardpad betekent dat tokenauth: als er geen expliciet auth-pad is geconfigureerd, wordt gateway-opstart opgelost naar tokenmodus en wordt er voor die opstart een runtime-only token gegenereerd, dus **lokale WS-clients moeten authenticeren**. Configureer `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` of `OPENCLAW_GATEWAY_PASSWORD` expliciet wanneer clients een stabiel geheim nodig hebben over herstarts heen. Dit blokkeert andere lokale processen om de Gateway aan te roepen.

    Als je een ander authenticatiepad verkiest, kun je expliciet de wachtwoordmodus kiezen (of, voor identiteitsbewuste reverse proxies, `trusted-proxy`). Als je **echt** open loopback wilt, stel dan `gateway.auth.mode: "none"` expliciet in je configuratie in. Doctor kan op elk moment een token voor je genereren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Moet ik herstarten nadat ik de configuratie heb gewijzigd?">
    De Gateway bewaakt de configuratie en ondersteunt hot-reload:

    - `gateway.reload.mode: "hybrid"` (standaard): veilige wijzigingen direct toepassen, herstarten voor kritieke wijzigingen
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

    - `off`: verbergt de taglinetekst maar behoudt de bannertitel/versieregel.
    - `default`: gebruikt telkens `All your chats, one OpenClaw.`.
    - `random`: roterende grappige/seizoensgebonden taglines (standaardgedrag).
    - Als je helemaal geen banner wilt, stel dan env `OPENCLAW_HIDE_BANNER=1` in.

  </Accordion>

  <Accordion title="Hoe schakel ik zoeken op het web (en web ophalen) in?">
    `web_fetch` werkt zonder API-sleutel. `web_search` hangt af van je geselecteerde
    provider:

    - API-ondersteunde providers zoals Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity en Tavily vereisen hun normale API-sleutelinstelling.
    - Grok kan xAI OAuth uit modelauthenticatie hergebruiken, of terugvallen op `XAI_API_KEY` / pluginconfiguratie voor webzoekopdrachten.
    - Ollama Web Search vereist geen sleutel, maar gebruikt je geconfigureerde Ollama-host en vereist `ollama signin`.
    - DuckDuckGo vereist geen sleutel, maar is een onofficiële HTML-gebaseerde integratie.
    - SearXNG vereist geen sleutel/wordt zelf gehost; configureer `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Aanbevolen:** voer `openclaw configure --section web` uit en kies een provider.
    Omgevingsalternatieven:

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

    Providerspecifieke configuratie voor webzoekopdrachten staat nu onder `plugins.entries.<plugin>.config.webSearch.*`.
    Verouderde providerpaden `tools.web.search.*` worden tijdelijk nog geladen voor compatibiliteit, maar mogen niet worden gebruikt voor nieuwe configuraties.
    Firecrawl-fallbackconfiguratie voor web-fetch staat onder `plugins.entries.firecrawl.config.webFetch.*`.

    Opmerkingen:

    - Als je allowlists gebruikt, voeg dan `web_search`/`web_fetch`/`x_search` of `group:web` toe.
    - `web_fetch` is standaard ingeschakeld (tenzij expliciet uitgeschakeld).
    - Als `tools.web.fetch.provider` wordt weggelaten, detecteert OpenClaw automatisch de eerste beschikbare fallbackprovider voor ophalen uit beschikbare inloggegevens. De officiële Firecrawl-plugin levert die fallback.
    - Daemons lezen env-vars uit `~/.openclaw/.env` (of de serviceomgeving).

    Docs: [Webtools](/nl/tools/web).

  </Accordion>

  <Accordion title="config.apply heeft mijn configuratie gewist. Hoe herstel ik dit en voorkom ik het?">
    `config.apply` vervangt de **volledige configuratie**. Als je een gedeeltelijk object verzendt, wordt al het
    andere verwijderd.

    De huidige OpenClaw beschermt tegen veel onbedoelde overschrijvingen:

    - Configuratieschrijfacties die eigendom zijn van OpenClaw valideren de volledige configuratie na de wijziging voordat er wordt geschreven.
    - Ongeldige of destructieve schrijfacties die eigendom zijn van OpenClaw worden geweigerd en opgeslagen als `openclaw.json.rejected.*`.
    - Als een directe bewerking het opstarten of hot reload verbreekt, faalt Gateway gesloten of wordt de reload overgeslagen; `openclaw.json` wordt niet herschreven.
    - `openclaw doctor --fix` is eigenaar van herstel en kan de laatst bekende werkende configuratie herstellen terwijl het geweigerde bestand wordt opgeslagen als `openclaw.json.clobbered.*`.

    Herstellen:

    - Controleer `openclaw logs --follow` op `Invalid config at`, `Config write rejected:` of `config reload skipped (invalid config)`.
    - Inspecteer de nieuwste `openclaw.json.clobbered.*` of `openclaw.json.rejected.*` naast de actieve configuratie.
    - Voer `openclaw config validate` en `openclaw doctor --fix` uit.
    - Kopieer alleen de bedoelde sleutels terug met `openclaw config set` of `config.patch`.
    - Als je geen laatst bekende werkende configuratie of geweigerde payload hebt, herstel dan vanaf een back-up, of voer `openclaw doctor` opnieuw uit en configureer kanalen/modellen opnieuw.
    - Als dit onverwacht was, dien dan een bug in en voeg je laatst bekende configuratie of een eventuele back-up toe.
    - Een lokale coding agent kan vaak een werkende configuratie reconstrueren uit logs of geschiedenis.

    Voorkomen:

    - Gebruik `openclaw config set` voor kleine wijzigingen.
    - Gebruik `openclaw configure` voor interactieve bewerkingen.
    - Gebruik eerst `config.schema.lookup` als je niet zeker bent van een exact pad of veldvorm; het retourneert een oppervlakkig schemaknooppunt plus directe samenvattingen van onderliggende elementen om verder door te klikken.
    - Gebruik `config.patch` voor gedeeltelijke RPC-bewerkingen; gebruik `config.apply` alleen voor volledige configuratievervanging.
    - Als je de agentgerichte `gateway`-tool vanuit een agent-run gebruikt, blijft die schrijfacties naar `tools.exec.ask` / `tools.exec.security` weigeren (inclusief verouderde `tools.bash.*`-aliassen die naar dezelfde beschermde exec-paden normaliseren).

    Docs: [Configuratie](/nl/cli/config), [Configureren](/nl/cli/configure), [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/nl/gateway/doctor).

  </Accordion>

  <Accordion title="Hoe voer ik een centrale Gateway uit met gespecialiseerde workers op meerdere apparaten?">
    Het gebruikelijke patroon is **één Gateway** (bijv. Raspberry Pi) plus **nodes** en **agents**:

    - **Gateway (centraal):** beheert kanalen (Signal/WhatsApp), routering en sessies.
    - **Nodes (apparaten):** Macs/iOS/Android verbinden als randapparaten en stellen lokale tools (`system.run`, `canvas`, `camera`) beschikbaar.
    - **Agents (workers):** afzonderlijke breinen/werkruimten voor speciale rollen (bijv. "Hetzner ops", "Persoonlijke gegevens").
    - **Sub-agents:** starten achtergrondwerk vanuit een hoofdagent wanneer je parallellisme wilt.
    - **TUI:** verbind met de Gateway en wissel tussen agents/sessies.

    Docs: [Nodes](/nl/nodes), [Externe toegang](/nl/gateway/remote), [Multi-agent-routering](/nl/concepts/multi-agent), [Sub-agents](/nl/tools/subagents), [TUI](/nl/web/tui).

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

    Standaard is `false` (met zichtbaar venster). Headless triggert op sommige sites sneller antibotcontroles. Zie [Browser](/nl/tools/browser).

    Headless gebruikt dezelfde **Chromium-engine** en werkt voor de meeste automatisering (formulieren, klikken, scraping, logins). De belangrijkste verschillen:

    - Geen zichtbaar browservenster (gebruik screenshots als je visuals nodig hebt).
    - Sommige sites zijn strenger over automatisering in headless-modus (CAPTCHA's, antibot).
      X/Twitter blokkeert bijvoorbeeld vaak headless-sessies.

  </Accordion>

  <Accordion title="Hoe gebruik ik Brave voor browserbesturing?">
    Stel `browser.executablePath` in op je Brave-binary (of een andere Chromium-gebaseerde browser) en herstart de Gateway.
    Bekijk de volledige configuratievoorbeelden in [Browser](/nl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Externe gateways en nodes

<AccordionGroup>
  <Accordion title="Hoe worden opdrachten doorgegeven tussen Telegram, de gateway en nodes?">
    Telegram-berichten worden afgehandeld door de **gateway**. De gateway voert de agent uit en
    roept pas daarna nodes aan via de **Gateway WebSocket** wanneer een nodetool nodig is:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes zien geen binnenkomend providerverkeer; ze ontvangen alleen node-RPC-aanroepen.

  </Accordion>

  <Accordion title="Hoe kan mijn agent toegang krijgen tot mijn computer als de Gateway extern wordt gehost?">
    Kort antwoord: **koppel je computer als node**. De Gateway draait ergens anders, maar kan
    `node.*`-tools (scherm, camera, systeem) op je lokale machine aanroepen via de Gateway WebSocket.

    Typische installatie:

    1. Voer de Gateway uit op de altijd-aan host (VPS/thuisserver).
    2. Plaats de Gateway-host + je computer op dezelfde tailnet.
    3. Zorg dat de Gateway-WS bereikbaar is (tailnet-bind of SSH-tunnel).
    4. Open de macOS-app lokaal en verbind in de modus **Extern via SSH** (of direct via tailnet)
       zodat deze zich als node kan registreren.
    5. Keur de node goed op de Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Er is geen afzonderlijke TCP-bridge vereist; nodes verbinden via de Gateway WebSocket.

    Beveiligingsherinnering: het koppelen van een macOS-node staat `system.run` toe op die machine. Koppel alleen
    apparaten die je vertrouwt en bekijk [Beveiliging](/nl/gateway/security).

    Docs: [Nodes](/nl/nodes), [Gateway-protocol](/nl/gateway/protocol), [macOS externe modus](/nl/platforms/mac/remote), [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale is verbonden, maar ik krijg geen antwoorden. Wat nu?">
    Controleer de basis:

    - Gateway draait: `openclaw gateway status`
    - Gateway-gezondheid: `openclaw status`
    - Kanaalgezondheid: `openclaw channels status`

    Controleer daarna authenticatie en routering:

    - Als je Tailscale Serve gebruikt, zorg dan dat `gateway.auth.allowTailscale` correct is ingesteld.
    - Als je verbinding maakt via een SSH-tunnel, bevestig dan dat de lokale tunnel actief is en naar de juiste poort wijst.
    - Bevestig dat je allowlists (DM of groep) je account bevatten.

    Docs: [Tailscale](/nl/gateway/tailscale), [Externe toegang](/nl/gateway/remote), [Kanalen](/nl/channels).

  </Accordion>

  <Accordion title="Kunnen twee OpenClaw-instanties met elkaar praten (lokaal + VPS)?">
    Ja. Er is geen ingebouwde "bot-naar-bot"-bridge, maar je kunt dit op een paar
    betrouwbare manieren verbinden:

    **Eenvoudigst:** gebruik een normaal chatkanaal waartoe beide bots toegang hebben (Telegram/Slack/WhatsApp).
    Laat Bot A een bericht naar Bot B sturen en laat Bot B vervolgens zoals gewoonlijk antwoorden.

    **CLI-bridge (generiek):** voer een script uit dat de andere Gateway aanroept met
    `openclaw agent --message ... --deliver`, gericht op een chat waar de andere bot
    luistert. Als één bot op een externe VPS staat, richt je CLI dan op die externe Gateway
    via SSH/Tailscale (zie [Externe toegang](/nl/gateway/remote)).

    Voorbeeldpatroon (uitvoeren vanaf een machine die de doel-Gateway kan bereiken):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: voeg een vangrail toe zodat de twee bots niet eindeloos blijven lussen (alleen vermeldingen, kanaal-
    allowlists, of een regel "niet antwoorden op botberichten").

    Docs: [Externe toegang](/nl/gateway/remote), [Agent-CLI](/nl/cli/agent), [Agent verzenden](/nl/tools/agent-send).

  </Accordion>

  <Accordion title="Heb ik afzonderlijke VPS'en nodig voor meerdere agents?">
    Nee. Eén Gateway kan meerdere agents hosten, elk met een eigen werkruimte, modelstandaarden
    en routering. Dat is de normale installatie en is veel goedkoper en eenvoudiger dan
    één VPS per agent draaien.

    Gebruik alleen afzonderlijke VPS'en wanneer je harde isolatie (beveiligingsgrenzen) of heel
    verschillende configuraties nodig hebt die je niet wilt delen. Houd anders één Gateway aan en
    gebruik meerdere agents of sub-agents.

  </Accordion>

  <Accordion title="Heeft het voordelen om een node op mijn persoonlijke laptop te gebruiken in plaats van SSH vanaf een VPS?">
    Ja - nodes zijn de eersteklas manier om je laptop vanaf een externe Gateway te bereiken, en ze
    maken meer mogelijk dan shelltoegang. De Gateway draait op macOS/Linux (Windows via WSL2) en is
    lichtgewicht (een kleine VPS of Raspberry Pi-klasse machine is prima; 4 GB RAM is ruim voldoende), dus een veelvoorkomende
    opstelling is een altijd-aan host plus je laptop als node.

    - **Geen inkomende SSH vereist.** Nodes verbinden uitgaand met de Gateway WebSocket en gebruiken apparaatkoppeling.
    - **Veiligere uitvoeringscontroles.** `system.run` wordt afgeschermd door node-allowlists/-goedkeuringen op die laptop.
    - **Meer apparaathulpmiddelen.** Nodes bieden naast `system.run` ook `canvas`, `camera` en `screen`.
    - **Lokale browserautomatisering.** Houd de Gateway op een VPS, maar voer Chrome lokaal uit via een node-host op de laptop, of koppel aan lokale Chrome op de host via Chrome MCP.

    SSH is prima voor ad-hoc shelltoegang, maar nodes zijn eenvoudiger voor doorlopende agentworkflows en
    apparaatautomatisering.

    Documentatie: [Nodes](/nl/nodes), [Nodes CLI](/nl/cli/nodes), [Browser](/nl/tools/browser).

  </Accordion>

  <Accordion title="Draaien nodes een gatewayservice?">
    Nee. Er mag maar **één gateway** per host draaien, tenzij je bewust geïsoleerde profielen gebruikt (zie [Meerdere gateways](/nl/gateway/multiple-gateways)). Nodes zijn randapparaten die verbinding maken
    met de gateway (iOS-/Android-nodes, of macOS-"nodemodus" in de menubalk-app). Zie [Node host CLI](/nl/cli/node) voor headless node-
    hosts en CLI-besturing.

    Een volledige herstart is vereist voor wijzigingen aan `gateway`, `discovery` en gehoste Plugin-oppervlakken.

  </Accordion>

  <Accordion title="Is er een API-/RPC-manier om config toe te passen?">
    Ja.

    - `config.schema.lookup`: inspecteer één config-subtree met de oppervlakkige schema-node, overeenkomende UI-hint en directe onderliggende samenvattingen voordat je schrijft
    - `config.get`: haal de huidige snapshot + hash op
    - `config.patch`: veilige gedeeltelijke update (aanbevolen voor de meeste RPC-bewerkingen); herlaadt live wanneer mogelijk en herstart wanneer vereist
    - `config.apply`: valideer + vervang de volledige config; herlaadt live wanneer mogelijk en herstart wanneer vereist
    - De agentgerichte `gateway` runtime-tool weigert nog steeds `tools.exec.ask` / `tools.exec.security` te herschrijven; legacy `tools.bash.*`-aliassen normaliseren naar dezelfde beschermde exec-paden

  </Accordion>

  <Accordion title="Minimaal verstandige config voor een eerste installatie">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dit stelt je workspace in en beperkt wie de bot kan activeren.

  </Accordion>

  <Accordion title="Hoe stel ik Tailscale in op een VPS en verbind ik vanaf mijn Mac?">
    Minimale stappen:

    1. **Installeer + log in op de VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installeer + log in op je Mac**
       - Gebruik de Tailscale-app en log in bij dezelfde tailnet.
    3. **Schakel MagicDNS in (aanbevolen)**
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

    Documentatie: [Gateway-protocol](/nl/gateway/protocol), [Discovery](/nl/gateway/discovery), [externe macOS-modus](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Moet ik op een tweede laptop installeren of gewoon een node toevoegen?">
    Als je alleen **lokale hulpmiddelen** (screen/camera/exec) op de tweede laptop nodig hebt, voeg die dan toe als
    **node**. Zo behoud je één Gateway en voorkom je dubbele config. Lokale node-tools zijn
    momenteel alleen voor macOS, maar we zijn van plan ze uit te breiden naar andere besturingssystemen.

    Installeer alleen een tweede Gateway wanneer je **harde isolatie** of twee volledig aparte bots nodig hebt.

    Documentatie: [Nodes](/nl/nodes), [Nodes CLI](/nl/cli/nodes), [Meerdere gateways](/nl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars en .env laden

<AccordionGroup>
  <Accordion title="Hoe laadt OpenClaw omgevingsvariabelen?">
    OpenClaw leest env vars uit het bovenliggende proces (shell, launchd/systemd, CI, enz.) en laadt daarnaast:

    - `.env` uit de huidige werkdirectory
    - een globale fallback-`.env` uit `~/.openclaw/.env` (ook bekend als `$OPENCLAW_STATE_DIR/.env`)

    Geen van beide `.env`-bestanden overschrijft bestaande env vars.
    Provider-credentialvariabelen zijn een uitzondering voor workspace-`.env`: sleutels zoals
    `GEMINI_API_KEY`, `XAI_API_KEY` of `MISTRAL_API_KEY` worden genegeerd uit workspace-
    `.env` en moeten in de procesomgeving, `~/.openclaw/.env` of config `env` staan.

    Je kunt ook inline env vars in config definiëren (alleen toegepast als ze ontbreken in de proces-env):

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

  <Accordion title="Ik heb de Gateway via de service gestart en mijn env vars zijn verdwenen. Wat nu?">
    Twee veelvoorkomende oplossingen:

    1. Zet de ontbrekende sleutels in `~/.openclaw/.env`, zodat ze worden opgepikt zelfs wanneer de service je shell-env niet erft.
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

    Dit voert je login-shell uit en importeert alleen ontbrekende verwachte sleutels (overschrijft nooit). Env var-equivalenten:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ik heb COPILOT_GITHUB_TOKEN ingesteld, maar de modellenstatus toont "Shell env: off." Waarom?'>
    `openclaw models status` rapporteert of **shell-env-import** is ingeschakeld. "Shell env: off"
    betekent **niet** dat je env vars ontbreken - het betekent alleen dat OpenClaw je
    login-shell niet automatisch laadt.

    Als de Gateway als service draait (launchd/systemd), erft die je shell-
    omgeving niet. Los dit op met een van deze opties:

    1. Zet de token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Of schakel shellimport in (`env.shellEnv.enabled: true`).
    3. Of voeg deze toe aan je config-`env`-blok (alleen toegepast als die ontbreekt).

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
    Stel dit in op een positieve waarde om inactiviteitsverval in te schakelen. Wanneer ingeschakeld, start het **volgende**
    bericht na de inactieve periode een nieuwe sessie-id voor die chatsleutel.
    Dit verwijdert geen transcripten - het start alleen een nieuwe sessie.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Is er een manier om een team van OpenClaw-instanties te maken (één CEO en veel agents)?">
    Ja, via **multi-agentrouting** en **sub-agents**. Je kunt één coördinator-
    agent en meerdere worker-agents maken met hun eigen workspaces en modellen.

    Dat gezegd hebbende, dit kan het beste worden gezien als een **leuk experiment**. Het gebruikt veel tokens en is vaak
    minder efficiënt dan één bot gebruiken met aparte sessies. Het typische model dat we
    voor ogen hebben, is één bot waarmee je praat, met verschillende sessies voor parallel werk. Die
    bot kan ook sub-agents starten wanneer nodig.

    Documentatie: [Multi-agentrouting](/nl/concepts/multi-agent), [Sub-agents](/nl/tools/subagents), [Agents CLI](/nl/cli/agents).

  </Accordion>

  <Accordion title="Waarom werd context halverwege een taak afgekapt? Hoe voorkom ik dat?">
    Sessiecontext wordt beperkt door het modelvenster. Lange chats, grote tooluitvoer of veel
    bestanden kunnen Compaction of afkapping veroorzaken.

    Wat helpt:

    - Vraag de bot om de huidige status samen te vatten en naar een bestand te schrijven.
    - Gebruik `/compact` vóór lange taken, en `/new` wanneer je van onderwerp wisselt.
    - Bewaar belangrijke context in de workspace en vraag de bot die terug te lezen.
    - Gebruik sub-agents voor lang of parallel werk, zodat de hoofdchat kleiner blijft.
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

    Notities:

    - Onboarding biedt ook **Reset** aan als er een bestaande config wordt gevonden. Zie [Onboarding (CLI)](/nl/start/wizard).
    - Als je profielen hebt gebruikt (`--profile` / `OPENCLAW_PROFILE`), reset dan elke state-dir (standaarden zijn `~/.openclaw-<profile>`).
    - Dev-reset: `openclaw gateway --dev --reset` (alleen dev; wist dev-config + credentials + sessies + workspace).

  </Accordion>

  <Accordion title='Ik krijg fouten "context too large" - hoe reset of compacteer ik?'>
    Gebruik een van deze opties:

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

    - Schakel **sessiepruning** (`agents.defaults.contextPruning`) in of stem deze af om oude tooluitvoer in te korten.
    - Gebruik een model met een groter contextvenster.

    Documentatie: [Compaction](/nl/concepts/compaction), [Sessiepruning](/nl/concepts/session-pruning), [Sessiebeheer](/nl/concepts/session).

  </Accordion>

  <Accordion title='Waarom zie ik "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dit is een provider-validatiefout: het model heeft een `tool_use`-blok uitgegeven zonder de vereiste
    `input`. Dit betekent meestal dat de sessiegeschiedenis verouderd of beschadigd is (vaak na lange threads
    of een tool-/schemawijziging).

    Oplossing: start een nieuwe sessie met `/new` (zelfstandig bericht).

  </Accordion>

  <Accordion title="Waarom krijg ik elke 30 minuten Heartbeat-berichten?">
    Heartbeats draaien standaard elke **30m** (**1h** bij gebruik van OAuth-auth). Pas ze aan of schakel ze uit:

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

    Als `HEARTBEAT.md` bestaat maar feitelijk leeg is (alleen lege regels,
    Markdown-/HTML-opmerkingen, Markdown-koppen zoals `# Heading`, fence-markeringen,
    of lege checklist-stubs), slaat OpenClaw de Heartbeat-run over om API-aanroepen te besparen.
    Als het bestand ontbreekt, wordt de Heartbeat nog steeds uitgevoerd en bepaalt het model wat het moet doen.

    Overrides per agent gebruiken `agents.list[].heartbeat`. Docs: [Heartbeat](/nl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Moet ik een "botaccount" toevoegen aan een WhatsApp-groep?'>
    Nee. OpenClaw draait op **je eigen account**, dus als jij in de groep zit, kan OpenClaw die zien.
    Standaard worden groepsantwoorden geblokkeerd totdat je afzenders toestaat (`groupPolicy: "allowlist"`).

    Als je wilt dat alleen **jij** groepsantwoorden kunt triggeren:

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

    Optie 2 (als al geconfigureerd/op de allowlist): toon groepen uit de configuratie:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs: [WhatsApp](/nl/channels/whatsapp), [Directory](/nl/cli/directory), [Logs](/nl/cli/logs).

  </Accordion>

  <Accordion title="Waarom antwoordt OpenClaw niet in een groep?">
    Twee veelvoorkomende oorzaken:

    - Mention-gating staat aan (standaard). Je moet de bot @vermelden (of overeenkomen met `mentionPatterns`).
    - Je hebt `channels.whatsapp.groups` geconfigureerd zonder `"*"` en de groep staat niet op de allowlist.

    Zie [Groepen](/nl/channels/groups) en [Groepsberichten](/nl/channels/group-messages).

  </Accordion>

  <Accordion title="Delen groepen/threads context met DM's?">
    Directe chats worden standaard samengevoegd met de hoofdsessie. Groepen/kanalen hebben hun eigen sessiesleutels, en Telegram-onderwerpen / Discord-threads zijn aparte sessies. Zie [Groepen](/nl/channels/groups) en [Groepsberichten](/nl/channels/group-messages).
  </Accordion>

  <Accordion title="Hoeveel werkruimten en agents kan ik maken?">
    Geen harde limieten. Tientallen (zelfs honderden) zijn prima, maar let op:

    - **Schijfgroei:** sessies + transcripties staan onder `~/.openclaw/agents/<agentId>/sessions/`.
    - **Tokenkosten:** meer agents betekent meer gelijktijdig modelgebruik.
    - **Operationele overhead:** auth-profielen, werkruimten en kanaalroutering per agent.

    Tips:

    - Houd één **actieve** werkruimte per agent aan (`agents.defaults.workspace`).
    - Ruim oude sessies op (verwijder JSONL- of store-vermeldingen) als de schijf groeit.
    - Gebruik `openclaw doctor` om losse werkruimten en profielmismatches te vinden.

  </Accordion>

  <Accordion title="Kan ik meerdere bots of chats tegelijk draaien (Slack), en hoe stel ik dat in?">
    Ja. Gebruik **Multi-Agent Routing** om meerdere geïsoleerde agents te draaien en inkomende berichten te routeren op
    kanaal/account/peer. Slack wordt ondersteund als kanaal en kan aan specifieke agents worden gekoppeld.

    Browsertoegang is krachtig, maar niet "alles doen wat een mens kan" - anti-bot, CAPTCHA's en MFA kunnen
    automatisering nog steeds blokkeren. Gebruik voor de betrouwbaarste browserbesturing lokale Chrome MCP op de host,
    of gebruik CDP op de machine waarop de browser daadwerkelijk draait.

    Aanbevolen configuratie:

    - Altijd-aan Gateway-host (VPS/Mac mini).
    - Eén agent per rol (koppelingen).
    - Slack-kanaal/kanalen gekoppeld aan die agents.
    - Lokale browser via Chrome MCP of een node wanneer nodig.

    Docs: [Multi-Agent Routing](/nl/concepts/multi-agent), [Slack](/nl/channels/slack),
    [Browser](/nl/tools/browser), [Nodes](/nl/nodes).

  </Accordion>
</AccordionGroup>

## Modellen, failover en auth-profielen

Model-V&A — standaarden, selectie, aliassen, wisselen, failover, auth-profielen —
staat in de [Veelgestelde vragen over modellen](/nl/help/faq-models).

## Gateway: poorten, "al actief" en remote-modus

<AccordionGroup>
  <Accordion title="Welke poort gebruikt de Gateway?">
    `gateway.port` beheert de enkele gemultiplexte poort voor WebSocket + HTTP (Control UI, hooks, enz.).

    Voorrang:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Waarom zegt openclaw gateway status "Runtime: running" maar "Connectivity probe: failed"?'>
    Omdat "running" de weergave van de **supervisor** is (launchd/systemd/schtasks). De connectivity probe is de CLI die daadwerkelijk verbinding maakt met de gateway-WebSocket.

    Gebruik `openclaw gateway status` en vertrouw op deze regels:

    - `Probe target:` (de URL die de probe daadwerkelijk gebruikte)
    - `Listening:` (wat daadwerkelijk aan de poort is gebonden)
    - `Last gateway error:` (veelvoorkomende hoofdoorzaak wanneer het proces actief is maar de poort niet luistert)

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
    OpenClaw dwingt een runtime-lock af door de WebSocket-listener direct bij het opstarten te binden (standaard `ws://127.0.0.1:18789`). Als het binden mislukt met `EADDRINUSE`, wordt `GatewayLockError` gegooid om aan te geven dat er al een andere instantie luistert.

    Oplossing: stop de andere instantie, maak de poort vrij, of start met `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Hoe draai ik OpenClaw in remote-modus (client verbindt met een Gateway elders)?">
    Stel `gateway.mode: "remote"` in en wijs naar een externe WebSocket-URL, optioneel met remote-referenties op basis van een gedeeld geheim:

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

    - `openclaw gateway` start alleen wanneer `gateway.mode` `local` is (of wanneer je de override-vlag doorgeeft).
    - De macOS-app houdt het configuratiebestand in de gaten en wisselt live van modus wanneer deze waarden veranderen.
    - `gateway.remote.token` / `.password` zijn alleen client-side remote-referenties; ze schakelen op zichzelf geen lokale gateway-auth in.

  </Accordion>

  <Accordion title='De Control UI zegt "unauthorized" (of blijft opnieuw verbinden). Wat nu?'>
    Je gateway-authpad en de auth-methode van de UI komen niet overeen.

    Feiten (uit code):

    - De Control UI bewaart het token in `sessionStorage` voor de huidige browsertabsessie en geselecteerde gateway-URL, zodat verversen in dezelfde tab blijft werken zonder langlevende localStorage-tokenpersistentie te herstellen.
    - Bij `AUTH_TOKEN_MISMATCH` kunnen vertrouwde clients één begrensde retry proberen met een gecachet device-token wanneer de gateway retry-hints teruggeeft (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Die cached-token-retry hergebruikt nu de gecachete goedgekeurde scopes die bij het device-token zijn opgeslagen. Expliciete `deviceToken` / expliciete `scopes`-callers behouden nog steeds hun aangevraagde scopeset in plaats van gecachete scopes te erven.
    - Buiten dat retry-pad is de connect-auth-voorrang eerst expliciet gedeeld token/wachtwoord, daarna expliciet `deviceToken`, daarna opgeslagen device-token, daarna bootstrap-token.
    - Ingebouwde setup-code-bootstrap retourneert een node-device-token met `scopes: []` plus een begrensd operator-handoff-token voor vertrouwde mobiele onboarding. De operator-handoff kan native configuratie van tijdens setup lezen, maar verleent geen pairing-mutatiescopes of `operator.admin`.

    Oplossing:

    - Snelst: `openclaw dashboard` (print + kopieert de dashboard-URL, probeert te openen; toont SSH-hint als headless).
    - Als je nog geen token hebt: `openclaw doctor --generate-gateway-token`.
    - Als remote, tunnel eerst: `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`.
    - Shared-secret-modus: stel `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` in, en plak daarna het overeenkomende geheim in de instellingen van de Control UI.
    - Tailscale Serve-modus: zorg dat `gateway.auth.allowTailscale` is ingeschakeld en dat je de Serve-URL opent, niet een raw loopback-/tailnet-URL die Tailscale-identiteitsheaders omzeilt.
    - Trusted-proxy-modus: zorg dat je via de geconfigureerde identity-aware proxy komt, niet via een raw gateway-URL. Same-host loopback-proxy's hebben ook `gateway.auth.trustedProxy.allowLoopback = true` nodig.
    - Als de mismatch na die ene retry blijft bestaan, roteer/keur het gekoppelde device-token opnieuw goed:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Als die rotate-aanroep zegt dat deze is geweigerd, controleer twee dingen:
      - paired-device-sessies kunnen alleen hun **eigen** device roteren, tenzij ze ook `operator.admin` hebben
      - expliciete `--scope`-waarden mogen de huidige operator-scopes van de caller niet overschrijden
    - Nog steeds vast? Voer `openclaw status --all` uit en volg [Probleemoplossing](/nl/gateway/troubleshooting). Zie [Dashboard](/nl/web/dashboard) voor auth-details.

  </Accordion>

  <Accordion title="Ik heb gateway.bind op tailnet gezet, maar binden lukt niet en niets luistert">
    `tailnet`-binding kiest een Tailscale-IP uit je netwerkinterfaces (100.64.0.0/10). Als de machine niet op Tailscale zit (of de interface down is), is er niets om aan te binden.

    Oplossing:

    - Start Tailscale op die host (zodat die een 100.x-adres heeft), of
    - Schakel over naar `gateway.bind: "loopback"` / `"lan"`.

    Opmerking: `tailnet` is expliciet. `auto` geeft de voorkeur aan loopback; gebruik `gateway.bind: "tailnet"` wanneer je een tailnet-only binding wilt.

  </Accordion>

  <Accordion title="Kan ik meerdere Gateways op dezelfde host draaien?">
    Meestal niet - één Gateway kan meerdere berichtkanalen en agents draaien. Gebruik meerdere Gateways alleen wanneer je redundantie nodig hebt (bijv.: rescue-bot) of harde isolatie.

    Ja, maar je moet isoleren:

    - `OPENCLAW_CONFIG_PATH` (configuratie per instantie)
    - `OPENCLAW_STATE_DIR` (state per instantie)
    - `agents.defaults.workspace` (werkruimte-isolatie)
    - `gateway.port` (unieke poorten)

    Snelle configuratie (aanbevolen):

    - Gebruik `openclaw --profile <name> ...` per instantie (maakt automatisch `~/.openclaw-<name>`).
    - Stel een unieke `gateway.port` in elk profielconfiguratiebestand in (of geef `--port` door voor handmatige runs).
    - Installeer een service per profiel: `openclaw --profile <name> gateway install`.

    Profielen voegen ook een suffix toe aan servicenamen (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Volledige gids: [Meerdere gateways](/nl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Wat betekent "invalid handshake" / code 1008?'>
    De Gateway is een **WebSocket-server**, en verwacht dat het allereerste bericht
    een `connect`-frame is. Als die iets anders ontvangt, sluit die de verbinding
    met **code 1008** (policy violation).

    Veelvoorkomende oorzaken:

    - Je hebt de **HTTP**-URL in een browser geopend (`http://...`) in plaats van een WS-client.
    - Je hebt de verkeerde poort of het verkeerde pad gebruikt.
    - Een proxy of tunnel heeft auth-headers gestript of een niet-Gateway-verzoek gestuurd.

    Snelle oplossingen:

    1. Gebruik de WS-URL: `ws://<host>:18789` (of `wss://...` bij HTTPS).
    2. Open de WS-poort niet in een normale browsertab.
    3. Als auth aanstaat, neem het token/wachtwoord op in het `connect`-frame.

    Als je de CLI of TUI gebruikt, moet de URL er zo uitzien:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protocoldetails: [Gateway-protocol](/nl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging en debugging

<AccordionGroup>
  <Accordion title="Waar staan logs?">
    Bestandslogs (gestructureerd):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Je kunt een stabiel pad instellen via `logging.file`. Het bestandslogniveau wordt beheerd door `logging.level`. Console-uitgebreidheid wordt beheerd door `--verbose` en `logging.consoleLevel`.

    Snelste manier om logs te volgen:

    ```bash
    openclaw logs --follow
    ```

    Service-/supervisorlogs (wanneer de gateway via launchd/systemd draait):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profielen gebruiken `gateway-<profile>.log`; stderr wordt onderdrukt)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Zie [Probleemoplossing](/nl/gateway/troubleshooting) voor meer informatie.

  </Accordion>

  <Accordion title="Hoe start/stop/herstart ik de Gateway-service?">
    Gebruik de gateway-helpers:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Als je de gateway handmatig uitvoert, kan `openclaw gateway --force` de poort opnieuw claimen. Zie [Gateway](/nl/gateway).

  </Accordion>

  <Accordion title="Ik heb mijn terminal op Windows gesloten - hoe herstart ik OpenClaw?">
    Er zijn **drie Windows-installatiemodi**:

    **1) Lokale Windows Hub-configuratie:** de native app beheert een lokale, app-eigen WSL Gateway.

    Open **OpenClaw Companion** vanuit het Startmenu of de tray en gebruik daarna
    **Gateway Setup** of het tabblad Verbindingen.

    **2) Handmatige WSL2 Gateway:** de Gateway draait binnen Linux.

    Open PowerShell, ga naar WSL en herstart daarna:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Als je de service nooit hebt geinstalleerd, start deze dan op de voorgrond:

    ```bash
    openclaw gateway run
    ```

    **3) Native Windows CLI/Gateway:** de Gateway draait rechtstreeks in Windows.

    Open PowerShell en voer uit:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Als je deze handmatig uitvoert (geen service), gebruik dan:

    ```powershell
    openclaw gateway run
    ```

    Documentatie: [Windows](/nl/platforms/windows), [Gateway-service-runbook](/nl/gateway).

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

    - Model-authenticatie is niet geladen op de **gateway-host** (controleer `models status`).
    - Kanaalkoppeling/allowlist blokkeert antwoorden (controleer kanaalconfiguratie + logs).
    - WebChat/Dashboard is geopend zonder de juiste token.

    Als je op afstand werkt, bevestig dan dat de tunnel-/Tailscale-verbinding actief is en dat de
    Gateway-WebSocket bereikbaar is.

    Documentatie: [Kanalen](/nl/channels), [Probleemoplossing](/nl/gateway/troubleshooting), [Toegang op afstand](/nl/gateway/remote).

  </Accordion>

  <Accordion title='"Verbinding met gateway verbroken: geen reden" - wat nu?'>
    Dit betekent meestal dat de UI de WebSocket-verbinding is kwijtgeraakt. Controleer:

    1. Draait de Gateway? `openclaw gateway status`
    2. Is de Gateway gezond? `openclaw status`
    3. Heeft de UI de juiste token? `openclaw dashboard`
    4. Als je op afstand werkt, is de tunnel-/Tailscale-koppeling actief?

    Volg daarna de logs:

    ```bash
    openclaw logs --follow
    ```

    Documentatie: [Dashboard](/nl/web/dashboard), [Toegang op afstand](/nl/gateway/remote), [Probleemoplossing](/nl/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands mislukt. Wat moet ik controleren?">
    Begin met logs en kanaalstatus:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Koppel daarna de fout:

    - `BOT_COMMANDS_TOO_MUCH`: het Telegram-menu heeft te veel vermeldingen. OpenClaw beperkt al tot de Telegram-limiet en probeert het opnieuw met minder opdrachten, maar sommige menuvermeldingen moeten nog steeds worden verwijderd. Verminder plugin-/skill-/aangepaste opdrachten, of schakel `channels.telegram.commands.native` uit als je het menu niet nodig hebt.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, of vergelijkbare netwerkfouten: als je op een VPS zit of achter een proxy werkt, bevestig dan dat uitgaand HTTPS is toegestaan en dat DNS werkt voor `api.telegram.org`.

    Als de Gateway op afstand staat, zorg er dan voor dat je naar logs op de Gateway-host kijkt.

    Documentatie: [Telegram](/nl/channels/telegram), [Probleemoplossing voor kanalen](/nl/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI toont geen uitvoer. Wat moet ik controleren?">
    Bevestig eerst dat de Gateway bereikbaar is en dat de agent kan draaien:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Gebruik in de TUI `/status` om de huidige status te zien. Als je antwoorden verwacht in een chatkanaal,
    zorg er dan voor dat aflevering is ingeschakeld (`/deliver on`).

    Documentatie: [TUI](/nl/web/tui), [Slash-opdrachten](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Hoe stop ik de Gateway volledig en start ik deze daarna opnieuw?">
    Als je de service hebt geinstalleerd:

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

    Documentatie: [Gateway-service-runbook](/nl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart versus openclaw gateway">
    - `openclaw gateway restart`: herstart de **achtergrondservice** (launchd/systemd).
    - `openclaw gateway`: voert de gateway **op de voorgrond** uit voor deze terminalsessie.

    Als je de service hebt geinstalleerd, gebruik dan de gateway-opdrachten. Gebruik `openclaw gateway` wanneer
    je een eenmalige uitvoering op de voorgrond wilt.

  </Accordion>

  <Accordion title="Snelste manier om meer details te krijgen wanneer iets mislukt">
    Start de Gateway met `--verbose` om meer consoledetails te krijgen. Inspecteer daarna het logbestand voor kanaalauthenticatie, modelrouting en RPC-fouten.
  </Accordion>
</AccordionGroup>

## Media en bijlagen

<AccordionGroup>
  <Accordion title="Mijn skill heeft een afbeelding/PDF gegenereerd, maar er is niets verzonden">
    Uitgaande bijlagen van de agent moeten gestructureerde mediavelden gebruiken, zoals `media`, `mediaUrl`, `path`, of `filePath`. Zie [OpenClaw-assistentconfiguratie](/nl/start/openclaw) en [Agent verzenden](/nl/tools/agent-send).

    Verzenden via CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Controleer ook:

    - Het doelkanaal ondersteunt uitgaande media en wordt niet geblokkeerd door allowlists.
    - Het bestand valt binnen de groottelimieten van de provider (afbeeldingen worden verkleind tot maximaal 2048px).
    - `tools.fs.workspaceOnly=true` beperkt verzendingen met lokale paden tot de werkruimte, temp-/media-store en door sandbox gevalideerde bestanden.
    - `tools.fs.workspaceOnly=false` laat gestructureerde lokale mediaverzendingen host-lokale bestanden gebruiken die de agent al kan lezen, maar alleen voor media plus veilige documenttypen (afbeeldingen, audio, video, PDF, Office-documenten en gevalideerde tekstdocumenten zoals Markdown/MD, TXT, JSON, YAML en YML). Dit is geen geheime-scanner: een door de agent leesbare `secret.txt` of `config.json` kan worden bijgevoegd wanneer de extensie en contentvalidatie overeenkomen. Houd gevoelige bestanden buiten door agenten leesbare paden, of houd `tools.fs.workspaceOnly=true` aan voor strengere verzendingen met lokale paden.

    Zie [Afbeeldingen](/nl/nodes/images).

  </Accordion>
</AccordionGroup>

## Beveiliging en toegangsbeheer

<AccordionGroup>
  <Accordion title="Is het veilig om OpenClaw bloot te stellen aan inkomende DM's?">
    Behandel inkomende DM's als niet-vertrouwde invoer. Standaardinstellingen zijn ontworpen om risico te verminderen:

    - Standaardgedrag op kanalen die DM's ondersteunen is **koppeling**:
      - Onbekende afzenders ontvangen een koppelcode; de bot verwerkt hun bericht niet.
      - Keur goed met: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Openstaande verzoeken zijn beperkt tot **3 per kanaal**; controleer `openclaw pairing list --channel <channel> [--account <id>]` als een code niet is aangekomen.
    - DM's publiek openen vereist expliciete opt-in (`dmPolicy: "open"` en allowlist `"*"`).

    Voer `openclaw doctor` uit om risicovol DM-beleid zichtbaar te maken.

  </Accordion>

  <Accordion title="Is prompt injection alleen een zorg voor publieke bots?">
    Nee. Prompt injection gaat over **niet-vertrouwde content**, niet alleen over wie de bot kan DM'en.
    Als je assistent externe content leest (webzoekopdracht/-fetch, browserpagina's, e-mails,
    documentatie, bijlagen, geplakte logs), kan die content instructies bevatten die proberen
    het model over te nemen. Dit kan zelfs gebeuren als **jij de enige afzender bent**.

    Het grootste risico ontstaat wanneer tools zijn ingeschakeld: het model kan worden misleid om
    context te exfiltreren of tools namens jou aan te roepen. Beperk de blast radius door:

    - een alleen-lezen of tool-uitgeschakelde "reader"-agent te gebruiken om niet-vertrouwde content samen te vatten
    - `web_search` / `web_fetch` / `browser` uit te houden voor agents met ingeschakelde tools
    - gedecodeerde bestands-/documenttekst ook als niet-vertrouwd te behandelen: OpenResponses
      `input_file` en extractie van mediabijlagen plaatsen allebei geextraheerde tekst in
      expliciete grensmarkeringen voor externe content in plaats van ruwe bestandstekst door te geven
    - sandboxing en strikte tool-allowlists te gebruiken

    Details: [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Is OpenClaw minder veilig omdat het TypeScript/Node gebruikt in plaats van Rust/WASM?">
    Taal en runtime doen ertoe, maar ze zijn niet het grootste risico voor een persoonlijke
    agent. De praktische OpenClaw-risico's zijn Gateway-blootstelling, wie de
    bot kan berichten, prompt injection, toolbereik, credentialbeheer, browsertoegang, exec-
    toegang en vertrouwen in Skills of plugins van derden.

    Rust en WASM kunnen sterkere isolatie bieden voor sommige klassen code, maar
    ze lossen prompt injection, slechte allowlists, publieke Gateway-blootstelling,
    te brede tools of een browserprofiel dat al is ingelogd op gevoelige
    accounts niet op. Behandel die als de primaire controles:

    - houd de Gateway prive of geauthenticeerd
    - gebruik koppeling en allowlists voor DM's en groepen
    - weiger risicovolle tools of voer ze in een sandbox uit voor niet-vertrouwde invoer
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

    Een veiligere baseline is:

    - Gateway gebonden aan `loopback`, of alleen blootgesteld via geauthenticeerde prive-
      toegang zoals een tailnet, SSH-tunnel, token-/wachtwoordauthenticatie of een correct
      geconfigureerde vertrouwde proxy
    - DM's in `pairing`- of `allowlist`-modus
    - groepen op een allowlist en afgeschermd met vermeldingen, tenzij elk lid vertrouwd is
    - hoog-risicotools (`exec`, `browser`, `gateway`, `cron`) geweigerd of strak
      afgebakend voor agents die niet-vertrouwde content lezen
    - sandboxing ingeschakeld waar tooluitvoering een kleinere blast radius nodig heeft

    Publieke binds zonder authenticatie, open DM's/groepen met tools en blootgestelde browser-
    besturing zijn de bevindingen die je eerst moet oplossen. Details:
    [Checklist beveiligingsaudit](/nl/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Zijn ClawHub-skills en plugins van derden veilig om te installeren?">
    Behandel skills en plugins van derden als code die je kiest te vertrouwen.
    ClawHub-skillpagina's tonen scanstatus voor installatie, maar scans zijn geen
    volledige beveiligingsgrens. OpenClaw voert geen ingebouwde lokale
    blokkering van gevaarlijke code uit tijdens installatie-/updateflows voor plugins of skills; gebruik
    operator-beheerd `security.installPolicy` voor lokale allow-/blockbeslissingen.

    Veiliger patroon:

    - geef de voorkeur aan vertrouwde auteurs en vastgepinde versies
    - lees de skill of plugin voordat je deze inschakelt
    - houd plugin- en skill-allowlists beperkt
    - voer workflows met niet-vertrouwde invoer uit in een sandbox met minimale tools
    - vermijd het geven van brede bestandssysteem-, exec-, browser- of geheimentoegang aan code van derden

    Details: [Skills](/nl/tools/skills), [Plugins](/nl/tools/plugin),
    [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Moet mijn bot een eigen e-mailadres, GitHub-account of telefoonnummer hebben?">
    Ja, voor de meeste setups. De bot isoleren met afzonderlijke accounts en telefoonnummers
    verkleint de impactradius als er iets misgaat. Dit maakt het ook makkelijker om
    referenties te roteren of toegang in te trekken zonder je persoonlijke accounts te beïnvloeden.

    Begin klein. Geef alleen toegang tot de tools en accounts die je echt nodig hebt, en breid
    later uit als dat nodig is.

    Documentatie: [Beveiliging](/nl/gateway/security), [Koppelen](/nl/channels/pairing).

  </Accordion>

  <Accordion title="Kan ik het autonomie geven over mijn sms-berichten en is dat veilig?">
    We raden volledige autonomie over je persoonlijke berichten **niet** aan. Het veiligste patroon is:

    - Houd privéberichten in **koppelingsmodus** of een strikte toelatingslijst.
    - Gebruik een **apart nummer of account** als je wilt dat het namens jou berichten stuurt.
    - Laat het concepten maken en **keur goed voordat er wordt verzonden**.

    Als je wilt experimenteren, doe dat dan op een speciaal account en houd het geïsoleerd. Zie
    [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Kan ik goedkopere modellen gebruiken voor persoonlijke-assistenttaken?">
    Ja, **als** de agent alleen chat gebruikt en de invoer vertrouwd is. Kleinere tiers zijn
    gevoeliger voor instructiekaping, dus vermijd ze voor agents met tools ingeschakeld
    of bij het lezen van niet-vertrouwde inhoud. Als je een kleiner model moet gebruiken, vergrendel
    tools en draai binnen een sandbox. Zie [Beveiliging](/nl/gateway/security).
  </Accordion>

  <Accordion title="Ik heb /start uitgevoerd in Telegram maar kreeg geen koppelingscode">
    Koppelingscodes worden **alleen** verzonden wanneer een onbekende afzender de bot een bericht stuurt en
    `dmPolicy: "pairing"` is ingeschakeld. `/start` genereert op zichzelf geen code.

    Controleer openstaande aanvragen:

    ```bash
    openclaw pairing list telegram
    ```

    Als je direct toegang wilt, voeg je afzender-id toe aan de toelatingslijst of stel `dmPolicy: "open"`
    in voor dat account.

  </Accordion>

  <Accordion title="WhatsApp: stuurt het berichten naar mijn contacten? Hoe werkt koppelen?">
    Nee. Het standaardbeleid voor WhatsApp-privéberichten is **koppelen**. Onbekende afzenders krijgen alleen een koppelingscode en hun bericht wordt **niet verwerkt**. OpenClaw antwoordt alleen op chats die het ontvangt of op expliciete verzendacties die jij activeert.

    Keur koppeling goed met:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Toon openstaande aanvragen:

    ```bash
    openclaw pairing list whatsapp
    ```

    Wizardprompt voor telefoonnummer: dit wordt gebruikt om je **toelatingslijst/eigenaar** in te stellen, zodat je eigen privéberichten zijn toegestaan. Het wordt niet gebruikt voor automatisch verzenden. Als je je persoonlijke WhatsApp-nummer gebruikt, gebruik dan dat nummer en schakel `channels.whatsapp.selfChatMode` in.

  </Accordion>
</AccordionGroup>

## Chatcommando's, taken afbreken en "het stopt niet"

<AccordionGroup>
  <Accordion title="Hoe voorkom ik dat interne systeemberichten in chat verschijnen?">
    De meeste interne of toolberichten verschijnen alleen wanneer **verbose**, **trace** of **reasoning** is ingeschakeld
    voor die sessie.

    Los dit op in de chat waar je het ziet:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Als het nog steeds veel ruis geeft, controleer dan de sessie-instellingen in de Control UI en stel verbose
    in op **overnemen**. Bevestig ook dat je geen botprofiel gebruikt met `verboseDefault` ingesteld
    op `on` in de configuratie.

    Documentatie: [Denken en verbose](/nl/tools/thinking), [Beveiliging](/nl/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Hoe stop/annuleer ik een lopende taak?">
    Stuur een van deze **als zelfstandig bericht** (zonder slash):

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

    Dit zijn afbreektriggers (geen slashcommando's).

    Voor achtergrondprocessen (vanuit de exec-tool) kun je de agent vragen om uit te voeren:

    ```
    process action:kill sessionId:XXX
    ```

    Overzicht van slashcommando's: zie [Slashcommando's](/nl/tools/slash-commands).

    De meeste commando's moeten worden verzonden als een **zelfstandig** bericht dat begint met `/`, maar een paar snelkoppelingen (zoals `/status`) werken ook inline voor afzenders op de toelatingslijst.

  </Accordion>

  <Accordion title='Hoe stuur ik een Discord-bericht vanuit Telegram? ("Cross-context messaging denied")'>
    OpenClaw blokkeert standaard berichtenverkeer **tussen providers**. Als een toolaanroep is gebonden
    aan Telegram, verzendt die niet naar Discord tenzij je dit expliciet toestaat.

    Schakel berichtenverkeer tussen providers in voor de agent:

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

    Herstart de Gateway na het bewerken van de configuratie.

  </Accordion>

  <Accordion title='Waarom voelt het alsof de bot snelle opeenvolgende berichten "negeert"?'>
    Prompts tijdens een run worden standaard naar de actieve run gestuurd. Gebruik `/queue` om het gedrag voor de actieve run te kiezen:

    - `steer` - stuur de actieve run bij op de volgende modelgrens
    - `followup` - zet berichten in de wachtrij en voer ze een voor een uit nadat de huidige run eindigt
    - `collect` - zet compatibele berichten in de wachtrij en antwoord eenmaal nadat de huidige run eindigt
    - `interrupt` - breek de huidige run af en begin opnieuw

    De standaardmodus is `steer`. Je kunt opties toevoegen zoals `debounce:0.5s cap:25 drop:summarize` voor wachtrijmodi. Zie [Commandowachtrij](/nl/concepts/queue) en [Sturingswachtrij](/nl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Diversen

<AccordionGroup>
  <Accordion title='Wat is het standaardmodel voor Anthropic met een API-sleutel?'>
    In OpenClaw zijn referenties en modelselectie gescheiden. Het instellen van `ANTHROPIC_API_KEY` (of het opslaan van een Anthropic API-sleutel in auth-profielen) schakelt authenticatie in, maar het daadwerkelijke standaardmodel is wat je configureert in `agents.defaults.model.primary` (bijvoorbeeld `anthropic/claude-sonnet-4-6` of `anthropic/claude-opus-4-6`). Als je `No credentials found for profile "anthropic:default"` ziet, betekent dit dat de Gateway geen Anthropic-referenties kon vinden in de verwachte `auth-profiles.json` voor de agent die draait.
  </Accordion>
</AccordionGroup>

---

Nog steeds vast? Vraag het in [Discord](https://discord.com/invite/clawd) of open een [GitHub-discussie](https://github.com/openclaw/openclaw/discussions).

## Gerelateerd

- [FAQ voor eerste gebruik](/nl/help/faq-first-run) — installeren, onboarden, auth, abonnementen, vroege fouten
- [Modellen-FAQ](/nl/help/faq-models) — modelselectie, failover, auth-profielen
- [Probleemoplossing](/nl/help/troubleshooting) — symptoomgerichte triage
