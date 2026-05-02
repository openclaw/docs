---
read_when:
    - Veelgestelde vragen over configuratie, installatie, ingebruikname of ondersteuning tijdens uitvoering beantwoorden
    - Door gebruikers gemelde problemen triëren vóór diepgaandere foutopsporing
summary: Veelgestelde vragen over de installatie, configuratie en het gebruik van OpenClaw
title: Veelgestelde vragen
x-i18n:
    generated_at: "2026-05-02T11:19:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

Snelle antwoorden plus diepere probleemoplossing voor praktijkopstellingen (lokale ontwikkeling, VPS, meerdere agents, OAuth/API-sleutels, model-failover). Zie [Probleemoplossing](/nl/gateway/troubleshooting) voor runtimediagnostiek. Zie [Configuratie](/nl/gateway/configuration) voor de volledige configuratiereferentie.

## Eerste 60 seconden als iets kapot is

1. **Snelle status (eerste controle)**

   ```bash
   openclaw status
   ```

   Snelle lokale samenvatting: besturingssysteem + update, bereikbaarheid van gateway/service, agents/sessies, providerconfiguratie + runtimeproblemen (wanneer de gateway bereikbaar is).

2. **Plakbaar rapport (veilig om te delen)**

   ```bash
   openclaw status --all
   ```

   Alleen-lezen diagnose met logstaart (tokens geredigeerd).

3. **Daemon- + poortstatus**

   ```bash
   openclaw gateway status
   ```

   Toont supervisor-runtime versus RPC-bereikbaarheid, de doel-URL van de probe en welke configuratie de service waarschijnlijk heeft gebruikt.

4. **Diepe probes**

   ```bash
   openclaw status --deep
   ```

   Voert een live Gateway-gezondheidsprobe uit, inclusief kanaalprobes wanneer ondersteund
   (vereist een bereikbare Gateway). Zie [Gezondheid](/nl/gateway/health).

5. **Volg het nieuwste log**

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
   openclaw health --verbose   # toont de doel-URL + configuratiepad bij fouten
   ```

   Vraagt de draaiende Gateway om een volledige snapshot (alleen WS). Zie [Gezondheid](/nl/gateway/health).

## Snel starten en eerste installatie

Q&A voor de eerste keer — installeren, onboarding, auth-routes, abonnementen, eerste fouten —
staat in de [FAQ voor de eerste keer](/nl/help/faq-first-run).

## Wat is OpenClaw?

<AccordionGroup>
  <Accordion title="Wat is OpenClaw, in één alinea?">
    OpenClaw is een persoonlijke AI-assistent die je op je eigen apparaten draait. Hij antwoordt op de berichtenvlakken die je al gebruikt (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat en gebundelde kanaalplugins zoals QQ Bot) en kan op ondersteunde platforms ook spraak + een live Canvas doen. De **Gateway** is het altijd actieve besturingsvlak; de assistent is het product.
  </Accordion>

  <Accordion title="Waardepropositie">
    OpenClaw is niet "gewoon een Claude-wrapper." Het is een **local-first besturingsvlak** waarmee je een
    capabele assistent op **je eigen hardware** kunt draaien, bereikbaar vanuit de chatapps die je al gebruikt, met
    sessies met status, geheugen en tools - zonder de controle over je workflows over te dragen aan een gehoste
    SaaS.

    Hoogtepunten:

    - **Jouw apparaten, jouw data:** draai de Gateway waar je wilt (Mac, Linux, VPS) en houd de
      workspace + sessiegeschiedenis lokaal.
    - **Echte kanalen, geen websandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/enzovoort,
      plus mobiele spraak en Canvas op ondersteunde platforms.
    - **Model-agnostisch:** gebruik Anthropic, OpenAI, MiniMax, OpenRouter, enzovoort, met routering
      en failover per agent.
    - **Alleen-lokaal optie:** draai lokale modellen zodat **alle data op je apparaat kan blijven** als je dat wilt.
    - **Routering met meerdere agents:** afzonderlijke agents per kanaal, account of taak, elk met een eigen
      workspace en standaardinstellingen.
    - **Open source en hackbaar:** inspecteer, breid uit en host zelf zonder vendor lock-in.

    Docs: [Gateway](/nl/gateway), [Kanalen](/nl/channels), [Multi-agent](/nl/concepts/multi-agent),
    [Geheugen](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Ik heb het net ingesteld - wat moet ik eerst doen?">
    Goede eerste projecten:

    - Bouw een website (WordPress, Shopify of een eenvoudige statische site).
    - Prototype een mobiele app (schets, schermen, API-plan).
    - Organiseer bestanden en mappen (opschonen, naamgeving, tagging).
    - Verbind Gmail en automatiseer samenvattingen of follow-ups.

    Het kan grote taken aan, maar het werkt het beste wanneer je ze in fasen splitst en
    subagents gebruikt voor parallel werk.

  </Accordion>

  <Accordion title="Wat zijn de vijf belangrijkste dagelijkse toepassingen voor OpenClaw?">
    Dagelijkse winst ziet er meestal zo uit:

    - **Persoonlijke briefings:** samenvattingen van inbox, agenda en nieuws dat jij belangrijk vindt.
    - **Onderzoek en schrijven:** snel onderzoek, samenvattingen en eerste concepten voor e-mails of docs.
    - **Herinneringen en follow-ups:** door Cron of Heartbeat aangedreven duwtjes en checklists.
    - **Browserautomatisering:** formulieren invullen, data verzamelen en webtaken herhalen.
    - **Coördinatie tussen apparaten:** stuur een taak vanaf je telefoon, laat de Gateway die op een server uitvoeren en krijg het resultaat terug in chat.

  </Accordion>

  <Accordion title="Kan OpenClaw helpen met leadgeneratie, outreach, advertenties en blogs voor een SaaS?">
    Ja, voor **onderzoek, kwalificatie en conceptteksten**. Het kan sites scannen, shortlists maken,
    prospects samenvatten en concepten schrijven voor outreach of advertentieteksten.

    Houd bij **outreach of advertentiecampagnes** een mens in de loop. Vermijd spam, volg lokale wetgeving en
    platformbeleid, en controleer alles voordat het wordt verzonden. Het veiligste patroon is
    OpenClaw laten opstellen en jij keurt goed.

    Docs: [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Wat zijn de voordelen ten opzichte van Claude Code voor webontwikkeling?">
    OpenClaw is een **persoonlijke assistent** en coördinatielaag, geen vervanging voor een IDE. Gebruik
    Claude Code of Codex voor de snelste directe codeerloop binnen een repo. Gebruik OpenClaw wanneer je
    duurzaam geheugen, toegang tussen apparaten en toolorkestratie wilt.

    Voordelen:

    - **Persistente geheugen + workspace** over sessies heen
    - **Toegang op meerdere platforms** (WhatsApp, Telegram, TUI, WebChat)
    - **Toolorkestratie** (browser, bestanden, planning, hooks)
    - **Altijd actieve Gateway** (draai op een VPS, communiceer vanaf overal)
    - **Nodes** voor lokale browser/scherm/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills en automatisering

<AccordionGroup>
  <Accordion title="Hoe pas ik skills aan zonder de repo vuil te houden?">
    Gebruik beheerde overrides in plaats van de repo-kopie te bewerken. Zet je wijzigingen in `~/.openclaw/skills/<name>/SKILL.md` (of voeg een map toe via `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). De prioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebundeld → `skills.load.extraDirs`, dus beheerde overrides winnen nog steeds van gebundelde skills zonder git aan te raken. Als je de skill globaal geïnstalleerd nodig hebt maar alleen zichtbaar voor sommige agents, bewaar de gedeelde kopie dan in `~/.openclaw/skills` en beheer zichtbaarheid met `agents.defaults.skills` en `agents.list[].skills`. Alleen wijzigingen die upstreamwaardig zijn, horen in de repo te staan en als PR's uit te gaan.
  </Accordion>

  <Accordion title="Kan ik skills laden vanuit een aangepaste map?">
    Ja. Voeg extra mappen toe via `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (laagste prioriteit). De standaardprioriteit is `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebundeld → `skills.load.extraDirs`. `clawhub` installeert standaard in `./skills`, wat OpenClaw in de volgende sessie behandelt als `<workspace>/skills`. Als de skill alleen zichtbaar moet zijn voor bepaalde agents, combineer dat dan met `agents.defaults.skills` of `agents.list[].skills`.
  </Accordion>

  <Accordion title="Hoe kan ik verschillende modellen gebruiken voor verschillende taken?">
    Vandaag zijn dit de ondersteunde patronen:

    - **Cron-taken**: geïsoleerde taken kunnen per taak een `model`-override instellen.
    - **Subagents**: routeer taken naar afzonderlijke agents met verschillende standaardmodellen.
    - **Wisselen op aanvraag**: gebruik `/model` om het model van de huidige sessie op elk moment te wisselen.

    Zie [Cron-taken](/nl/automation/cron-jobs), [Multi-agentroutering](/nl/concepts/multi-agent) en [Slash-commando's](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="De bot loopt vast tijdens zwaar werk. Hoe laad ik dat uit?">
    Gebruik **subagents** voor lange of parallelle taken. Subagents draaien in hun eigen sessie,
    geven een samenvatting terug en houden je hoofdchat responsief.

    Vraag je bot om "spawn a sub-agent for this task" of gebruik `/subagents`.
    Gebruik `/status` in chat om te zien wat de Gateway nu doet (en of die bezig is).

    Tokentip: lange taken en subagents verbruiken allebei tokens. Als kosten een zorg zijn, stel dan een
    goedkoper model in voor subagents via `agents.defaults.subagents.model`.

    Docs: [Subagents](/nl/tools/subagents), [Achtergrondtaken](/nl/automation/tasks).

  </Accordion>

  <Accordion title="Hoe werken thread-gebonden subagentsessies op Discord?">
    Gebruik threadbindings. Je kunt een Discord-thread binden aan een subagent- of sessiedoel, zodat vervolgberichten in die thread op die gebonden sessie blijven.

    Basisflow:

    - Spawn met `sessions_spawn` met `thread: true` (en optioneel `mode: "session"` voor persistente follow-up).
    - Of bind handmatig met `/focus <target>`.
    - Gebruik `/agents` om de bindingsstatus te inspecteren.
    - Gebruik `/session idle <duration|off>` en `/session max-age <duration|off>` om automatisch unfocusen te beheren.
    - Gebruik `/unfocus` om de thread los te koppelen.

    Vereiste configuratie:

    - Globale standaardwaarden: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisch binden bij spawn: `channels.discord.threadBindings.spawnSessions` staat standaard op `true`; stel dit in op `false` om thread-gebonden sessiespawns uit te schakelen.

    Docs: [Subagents](/nl/tools/subagents), [Discord](/nl/channels/discord), [Configuratiereferentie](/nl/gateway/configuration-reference), [Slash-commando's](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Een subagent is klaar, maar de voltooiingsupdate ging naar de verkeerde plek of is nooit geplaatst. Wat moet ik controleren?">
    Controleer eerst de opgeloste route van de aanvrager:

    - Subagent-bezorging in voltooiingsmodus geeft de voorkeur aan elke gebonden thread- of gespreksroute wanneer die bestaat.
    - Als de voltooiingsoorsprong alleen een kanaal bevat, valt OpenClaw terug op de opgeslagen route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe bezorging nog steeds kan slagen.
    - Als er noch een gebonden route noch een bruikbare opgeslagen route bestaat, kan directe bezorging mislukken en valt het resultaat terug op bezorging via de sessiewachtrij in plaats van meteen in chat te plaatsen.
    - Ongeldige of verouderde doelen kunnen nog steeds een wachtrijfallback of definitieve bezorgingsfout afdwingen.
    - Als het laatste zichtbare assistentantwoord van het child de exacte stille token `NO_REPLY` / `no_reply` is, of exact `ANNOUNCE_SKIP`, onderdrukt OpenClaw bewust de aankondiging in plaats van eerdere verouderde voortgang te plaatsen.
    - Als het child een time-out kreeg na alleen toolcalls, kan de aankondiging dat samenvatten tot een korte samenvatting van gedeeltelijke voortgang in plaats van ruwe tooluitvoer opnieuw af te spelen.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Subagents](/nl/tools/subagents), [Achtergrondtaken](/nl/automation/tasks), [Sessietools](/nl/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron of herinneringen worden niet uitgevoerd. Wat moet ik controleren?">
    Cron draait binnen het Gateway-proces. Als de Gateway niet continu draait,
    worden geplande taken niet uitgevoerd.

    Checklist:

    - Bevestig dat cron is ingeschakeld (`cron.enabled`) en dat `OPENCLAW_SKIP_CRON` niet is ingesteld.
    - Controleer of de Gateway 24/7 draait (geen slaapstand/herstarts).
    - Verifieer tijdzone-instellingen voor de taak (`--tz` versus hosttijdzone).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Cron-taken](/nl/automation/cron-jobs), [Automatisering en taken](/nl/automation).

  </Accordion>

  <Accordion title="Cron is uitgevoerd, maar er is niets naar het kanaal gestuurd. Waarom?">
    Controleer eerst de bezorgmodus:

    - `--no-deliver` / `delivery.mode: "none"` betekent dat er geen fallbackverzending door de runner wordt verwacht.
    - Een ontbrekend of ongeldig aankondigingsdoel (`channel` / `to`) betekent dat de runner uitgaande bezorging heeft overgeslagen.
    - Kanaalautorisatiefouten (`unauthorized`, `Forbidden`) betekenen dat de runner probeerde te bezorgen, maar dat de referenties dit blokkeerden.
    - Een stil geïsoleerd resultaat (alleen `NO_REPLY` / `no_reply`) wordt behandeld als bewust niet-bezorgbaar, dus de runner onderdrukt ook fallbackbezorging in de wachtrij.

    Voor geïsoleerde Cron-taken kan de agent nog steeds rechtstreeks verzenden met de `message`-
    tool wanneer er een chatroute beschikbaar is. `--announce` beheert alleen het fallbackpad van de runner
    voor definitieve tekst die de agent nog niet zelf heeft verzonden.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentatie: [Cron-taken](/nl/automation/cron-jobs), [Achtergrondtaken](/nl/automation/tasks).

  </Accordion>

  <Accordion title="Waarom wisselde een geïsoleerde Cron-run van model of probeerde die het één keer opnieuw?">
    Dat is meestal het pad voor live modelwisseling, geen dubbele planning.

    Geïsoleerde Cron kan een runtime-modeloverdracht bewaren en opnieuw proberen wanneer de actieve
    run `LiveSessionModelSwitchError` gooit. De nieuwe poging behoudt de gewisselde
    provider/het gewisselde model, en als de wissel een nieuwe override voor het auth-profiel bevatte, bewaart Cron
    die ook voordat opnieuw wordt geprobeerd.

    Gerelateerde selectieregels:

    - Gmail-hookmodeloverride wint als eerste wanneer van toepassing.
    - Daarna `model` per taak.
    - Daarna een opgeslagen modeloverride voor de Cron-sessie.
    - Daarna de normale selectie van agent-/standaardmodel.

    De herhaallus is begrensd. Na de eerste poging plus 2 wisselherhalingen
    breekt Cron af in plaats van eindeloos te blijven lopen.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentatie: [Cron-taken](/nl/automation/cron-jobs), [Cron-CLI](/nl/cli/cron).

  </Accordion>

  <Accordion title="Hoe installeer ik Skills op Linux?">
    Gebruik native `openclaw skills`-opdrachten of plaats Skills in je werkruimte. De macOS Skills-UI is niet beschikbaar op Linux.
    Blader door Skills op [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Native `openclaw skills install` schrijft naar de actieve werkruimte-directory `skills/`.
    Installeer de afzonderlijke `clawhub`-CLI alleen als je je eigen Skills wilt publiceren of
    synchroniseren. Voor gedeelde installaties tussen agents plaats je de Skill onder
    `~/.openclaw/skills` en gebruik je `agents.defaults.skills` of
    `agents.list[].skills` als je wilt beperken welke agents deze kunnen zien.

  </Accordion>

  <Accordion title="Kan OpenClaw taken volgens een schema of continu op de achtergrond uitvoeren?">
    Ja. Gebruik de Gateway-planner:

    - **Cron-taken** voor geplande of terugkerende taken (blijven bestaan na herstarts).
    - **Heartbeat** voor periodieke controles van de "hoofdsessie".
    - **Geïsoleerde taken** voor autonome agents die samenvattingen plaatsen of aan chats bezorgen.

    Documentatie: [Cron-taken](/nl/automation/cron-jobs), [Automatisering en taken](/nl/automation),
    [Heartbeat](/nl/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kan ik Apple macOS-only Skills uitvoeren vanaf Linux?">
    Niet rechtstreeks. macOS-Skills worden afgeschermd door `metadata.openclaw.os` plus vereiste binaries, en Skills verschijnen alleen in de systeemprompt wanneer ze in aanmerking komen op de **Gateway-host**. Op Linux worden `darwin`-only Skills (zoals `apple-notes`, `apple-reminders`, `things-mac`) niet geladen, tenzij je de afscherming overschrijft.

    Je hebt drie ondersteunde patronen:

    **Optie A - voer de Gateway uit op een Mac (eenvoudigst).**
    Voer de Gateway uit waar de macOS-binaries bestaan, en verbind vervolgens vanaf Linux in [remote mode](#gateway-ports-already-running-and-remote-mode) of via Tailscale. De Skills laden normaal omdat de Gateway-host macOS is.

    **Optie B - gebruik een macOS-node (geen SSH).**
    Voer de Gateway uit op Linux, koppel een macOS-node (menubalkapp) en zet **Node Run Commands** op "Always Ask" of "Always Allow" op de Mac. OpenClaw kan macOS-only Skills als geschikt behandelen wanneer de vereiste binaries op de node bestaan. De agent voert die Skills uit via de `nodes`-tool. Als je "Always Ask" kiest, voegt het goedkeuren van "Always Allow" in de prompt die opdracht toe aan de toelatingslijst.

    **Optie C - proxy macOS-binaries via SSH (geavanceerd).**
    Houd de Gateway op Linux, maar laat de vereiste CLI-binaries verwijzen naar SSH-wrappers die op een Mac draaien. Overschrijf daarna de Skill om Linux toe te staan zodat die geschikt blijft.

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
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native installaties komen terecht in de actieve werkruimte-directory `skills/`. Voor gedeelde Skills tussen agents plaats je ze in `~/.openclaw/skills/<name>/SKILL.md`. Als slechts sommige agents een gedeelde installatie mogen zien, configureer dan `agents.defaults.skills` of `agents.list[].skills`. Sommige Skills verwachten binaries die via Homebrew zijn geïnstalleerd; op Linux betekent dat Linuxbrew (zie de Homebrew Linux FAQ-vermelding hierboven). Zie [Skills](/nl/tools/skills), [Skills-configuratie](/nl/tools/skills-config) en [ClawHub](/nl/tools/clawhub).

  </Accordion>

  <Accordion title="Hoe gebruik ik mijn bestaande ingelogde Chrome met OpenClaw?">
    Gebruik het ingebouwde `user`-browserprofiel, dat verbinding maakt via Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Als je een aangepaste naam wilt, maak dan een expliciet MCP-profiel aan:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dit pad kan de lokale hostbrowser of een verbonden browsernode gebruiken. Als de Gateway elders draait, voer dan een nodehost uit op de browsermachine of gebruik in plaats daarvan remote CDP.

    Huidige limieten van `existing-session` / `user`:

    - acties zijn ref-gestuurd, niet CSS-selector-gestuurd
    - uploads vereisen `ref` / `inputRef` en ondersteunen momenteel één bestand tegelijk
    - `responsebody`, PDF-export, downloadonderschepping en batchacties hebben nog steeds een beheerde browser of raw CDP-profiel nodig

  </Accordion>
</AccordionGroup>

## Sandboxing en geheugen

<AccordionGroup>
  <Accordion title="Is er specifieke documentatie over sandboxing?">
    Ja. Zie [Sandboxing](/nl/gateway/sandboxing). Voor Docker-specifieke configuratie (volledige Gateway in Docker of sandboximages), zie [Docker](/nl/install/docker).
  </Accordion>

  <Accordion title="Docker voelt beperkt - hoe schakel ik volledige functies in?">
    De standaardimage is security-first en draait als de `node`-gebruiker, dus die bevat geen
    systeempakketten, Homebrew of gebundelde browsers. Voor een completere setup:

    - Behoud `/home/node` met `OPENCLAW_HOME_VOLUME` zodat caches blijven bestaan.
    - Bak systeemafhankelijkheden in de image met `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installeer Playwright-browsers via de gebundelde CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Stel `PLAYWRIGHT_BROWSERS_PATH` in en zorg dat het pad behouden blijft.

    Documentatie: [Docker](/nl/install/docker), [Browser](/nl/tools/browser).

  </Accordion>

  <Accordion title="Kan ik DM's persoonlijk houden maar groepen openbaar/gesandboxt maken met één agent?">
    Ja - als je privéverkeer **DM's** zijn en je openbare verkeer **groepen** zijn.

    Gebruik `agents.defaults.sandbox.mode: "non-main"` zodat groep-/kanaalsessies (non-main keys) in de geconfigureerde sandboxbackend draaien, terwijl de hoofd-DM-sessie op de host blijft. Docker is de standaardbackend als je er geen kiest. Beperk daarna welke tools beschikbaar zijn in gesandboxte sessies via `tools.sandbox.tools`.

    Installatiewalkthrough + voorbeeldconfiguratie: [Groepen: persoonlijke DM's + openbare groepen](/nl/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Belangrijke configuratiereferentie: [Gateway-configuratie](/nl/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Hoe koppel ik een hostmap aan de sandbox?">
    Stel `agents.defaults.sandbox.docker.binds` in op `["host:path:mode"]` (bijv. `"/home/user/src:/src:ro"`). Globale en per-agent binds worden samengevoegd; per-agent binds worden genegeerd wanneer `scope: "shared"` is. Gebruik `:ro` voor alles wat gevoelig is en onthoud dat binds de bestandssysteemmuren van de sandbox omzeilen.

    OpenClaw valideert bindbronnen tegen zowel het genormaliseerde pad als het canonieke pad dat via de diepste bestaande voorouder wordt opgelost. Dat betekent dat ontsnappingen via symlink-ouders nog steeds fail-closed zijn, zelfs wanneer het laatste padsegment nog niet bestaat, en dat allowed-root-controles nog steeds gelden na symlinkresolutie.

    Zie [Sandboxing](/nl/gateway/sandboxing#custom-bind-mounts) en [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) voor voorbeelden en veiligheidsnotities.

  </Accordion>

  <Accordion title="Hoe werkt geheugen?">
    OpenClaw-geheugen bestaat gewoon uit Markdown-bestanden in de agentwerkruimte:

    - Dagelijkse notities in `memory/YYYY-MM-DD.md`
    - Gecureerde langetermijnnotities in `MEMORY.md` (alleen hoofd-/privésessies)

    OpenClaw voert ook een **stille geheugenflush vóór Compaction** uit om het model eraan te herinneren
    duurzame notities te schrijven vóór automatische Compaction. Dit draait alleen wanneer de werkruimte
    schrijfbaar is (read-only sandboxes slaan dit over). Zie [Geheugen](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Geheugen blijft dingen vergeten. Hoe zorg ik dat het blijft hangen?">
    Vraag de bot om **het feit naar geheugen te schrijven**. Langetermijnnotities horen in `MEMORY.md`,
    kortetermijncontext gaat naar `memory/YYYY-MM-DD.md`.

    Dit is nog steeds een gebied dat we verbeteren. Het helpt om het model eraan te herinneren herinneringen op te slaan;
    het zal weten wat het moet doen. Als het blijft vergeten, controleer dan of de Gateway bij elke run dezelfde
    werkruimte gebruikt.

    Documentatie: [Geheugen](/nl/concepts/memory), [Agentwerkruimte](/nl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Blijft geheugen voor altijd bestaan? Wat zijn de limieten?">
    Geheugenbestanden staan op schijf en blijven bestaan totdat je ze verwijdert. De limiet is je
    opslag, niet het model. De **sessiecontext** wordt nog steeds beperkt door het contextvenster
    van het model, dus lange gesprekken kunnen worden gecompacteerd of afgekapt. Daarom
    bestaat geheugenzoekfunctie - die haalt alleen de relevante delen terug in de context.

    Documentatie: [Geheugen](/nl/concepts/memory), [Context](/nl/concepts/context).

  </Accordion>

  <Accordion title="Vereist semantisch geheugen zoeken een OpenAI API-sleutel?">
    Alleen als je **OpenAI embeddings** gebruikt. Codex OAuth dekt chat/completions en
    geeft **geen** toegang tot embeddings, dus **inloggen met Codex (OAuth of de
    Codex CLI-login)** helpt niet voor semantisch geheugen zoeken. OpenAI embeddings
    hebben nog steeds een echte API-sleutel nodig (`OPENAI_API_KEY` of `models.providers.openai.apiKey`).

    Als je niet expliciet een provider instelt, selecteert OpenClaw automatisch een provider wanneer het
    een API-sleutel kan vinden (auth-profielen, `models.providers.*.apiKey` of omgevingsvariabelen).
    Het geeft de voorkeur aan OpenAI als er een OpenAI-sleutel wordt gevonden, anders Gemini als er een Gemini-sleutel
    wordt gevonden, daarna Voyage en daarna Mistral. Als er geen externe sleutel beschikbaar is, blijft geheugen
    zoeken uitgeschakeld totdat je het configureert. Als je een lokaal modelpad hebt
    geconfigureerd en aanwezig, geeft OpenClaw
    de voorkeur aan `local`. Ollama wordt ondersteund wanneer je expliciet
    `memorySearch.provider = "ollama"` instelt.

    Als je liever lokaal blijft, stel dan `memorySearch.provider = "local"` in (en optioneel
    `memorySearch.fallback = "none"`). Als je Gemini embeddings wilt, stel dan
    `memorySearch.provider = "gemini"` in en geef `GEMINI_API_KEY` op (of
    `memorySearch.remote.apiKey`). We ondersteunen **OpenAI, Gemini, Voyage, Mistral, Ollama of lokale** embedding-
    modellen - zie [Memory](/nl/concepts/memory) voor de installatiedetails.

  </Accordion>
</AccordionGroup>

## Waar dingen op schijf staan

<AccordionGroup>
  <Accordion title="Worden alle gegevens die met OpenClaw worden gebruikt lokaal opgeslagen?">
    Nee - **de status van OpenClaw is lokaal**, maar **externe diensten zien nog steeds wat je naar ze verstuurt**.

    - **Standaard lokaal:** sessies, geheugenbestanden, config en workspace staan op de Gateway-host
      (`~/.openclaw` + je workspace-map).
    - **Noodzakelijk extern:** berichten die je naar modelproviders (Anthropic/OpenAI/etc.) stuurt, gaan naar
      hun API's, en chatplatforms (WhatsApp/Telegram/Slack/etc.) slaan berichtgegevens op hun
      servers op.
    - **Jij bepaalt de voetafdruk:** lokale modellen gebruiken houdt prompts op je machine, maar kanaal-
      verkeer loopt nog steeds via de servers van het kanaal.

    Gerelateerd: [Agent-workspace](/nl/concepts/agent-workspace), [Memory](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Waar slaat OpenClaw zijn gegevens op?">
    Alles staat onder `$OPENCLAW_STATE_DIR` (standaard: `~/.openclaw`):

    | Pad                                                             | Doel                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hoofdconfig (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Verouderde OAuth-import (bij eerste gebruik naar auth-profielen gekopieerd) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-profielen (OAuth, API-sleutels en optioneel `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionele op bestanden gebaseerde secret-payload voor `file` SecretRef-providers |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Verouderd compatibiliteitsbestand (statische `api_key`-vermeldingen opgeschoond) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Providerstatus (bijv. `whatsapp/<accountId>/creds.json`)           |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Status per agent (agentDir + sessies)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Gespreksgeschiedenis en status (per agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sessiemetadata (per agent)                                         |

    Verouderd pad voor één agent: `~/.openclaw/agent/*` (gemigreerd door `openclaw doctor`).

    Je **workspace** (AGENTS.md, geheugenbestanden, skills, enz.) staat apart en wordt geconfigureerd via `agents.defaults.workspace` (standaard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Waar moeten AGENTS.md / SOUL.md / USER.md / MEMORY.md staan?">
    Deze bestanden staan in de **agent-workspace**, niet in `~/.openclaw`.

    - **Workspace (per agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optioneel `HEARTBEAT.md`.
      Rootbestand `memory.md` in kleine letters is alleen verouderde reparatie-invoer; `openclaw doctor --fix`
      kan het samenvoegen in `MEMORY.md` wanneer beide bestanden bestaan.
    - **Statusmap (`~/.openclaw`)**: config, kanaal-/providerstatus, auth-profielen, sessies, logs
      en gedeelde skills (`~/.openclaw/skills`).

    De standaardworkspace is `~/.openclaw/workspace`, configureerbaar via:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Als de bot na een herstart dingen "vergeet", controleer dan of de Gateway bij elke start dezelfde
    workspace gebruikt (en onthoud: externe modus gebruikt de **workspace van de gateway-host**,
    niet die van je lokale laptop).

    Tip: als je duurzaam gedrag of een duurzame voorkeur wilt, vraag de bot dan om dit **naar
    AGENTS.md of MEMORY.md te schrijven** in plaats van te vertrouwen op chatgeschiedenis.

    Zie [Agent-workspace](/nl/concepts/agent-workspace) en [Memory](/nl/concepts/memory).

  </Accordion>

  <Accordion title="Aanbevolen back-upstrategie">
    Zet je **agent-workspace** in een **privé** git-repo en maak ergens privé
    een back-up (bijvoorbeeld GitHub privé). Hiermee leg je geheugen + AGENTS/SOUL/USER-
    bestanden vast en kun je later de "geest" van de assistent herstellen.

    Commit **niets** onder `~/.openclaw` (referenties, sessies, tokens of versleutelde secret-payloads).
    Als je een volledig herstel nodig hebt, maak dan apart een back-up van zowel de workspace als de statusmap
    (zie de migratievraag hierboven).

    Docs: [Agent-workspace](/nl/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Hoe verwijder ik OpenClaw volledig?">
    Zie de aparte gids: [Verwijderen](/nl/install/uninstall).
  </Accordion>

  <Accordion title="Kunnen agents buiten de workspace werken?">
    Ja. De workspace is de **standaard cwd** en geheugenanker, geen harde sandbox.
    Relatieve paden worden binnen de workspace opgelost, maar absolute paden kunnen toegang krijgen tot andere
    hostlocaties tenzij sandboxing is ingeschakeld. Als je isolatie nodig hebt, gebruik dan
    [`agents.defaults.sandbox`](/nl/gateway/sandboxing) of sandboxinstellingen per agent. Als je
    wilt dat een repo de standaardwerkmap is, wijs dan de `workspace` van die agent
    naar de root van de repo. De OpenClaw-repo is alleen broncode; houd de
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
    Sessiestatus is eigendom van de **gateway-host**. Als je in externe modus werkt, staat de sessieopslag waar je om geeft op de externe machine, niet op je lokale laptop. Zie [Sessiebeheer](/nl/concepts/session).
  </Accordion>
</AccordionGroup>

## Basisprincipes van config

<AccordionGroup>
  <Accordion title="Welk formaat heeft de config? Waar staat die?">
    OpenClaw leest een optionele **JSON5**-config uit `$OPENCLAW_CONFIG_PATH` (standaard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Als het bestand ontbreekt, gebruikt het redelijk veilige standaardwaarden (inclusief een standaardworkspace van `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ik heb gateway.bind: "lan" (of "tailnet") ingesteld en nu luistert er niets / de UI zegt niet geautoriseerd'>
    Non-loopback binds **vereisen een geldig gateway-authpad**. In de praktijk betekent dat:

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

    - `gateway.remote.token` / `.password` schakelen lokale gateway-auth niet op zichzelf in.
    - Lokale aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
    - Stel voor wachtwoordauth in plaats daarvan `gateway.auth.mode: "password"` plus `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`) in.
    - Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, mislukt de resolutie gesloten (geen maskering door externe fallback).
    - Shared-secret Control UI-installaties authenticeren via `connect.params.auth.token` of `connect.params.auth.password` (opgeslagen in app-/UI-instellingen). Modi met identiteit, zoals Tailscale Serve of `trusted-proxy`, gebruiken in plaats daarvan requestheaders. Vermijd shared secrets in URL's.
    - Met `gateway.auth.mode: "trusted-proxy"` vereisen same-host loopback reverse proxies expliciet `gateway.auth.trustedProxy.allowLoopback = true` en een loopback-vermelding in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Waarom heb ik nu een token op localhost nodig?">
    OpenClaw handhaaft standaard gateway-auth, inclusief loopback. In het normale standaardpad betekent dat tokenauth: als er geen expliciet authpad is geconfigureerd, wordt bij het starten van de gateway tokenmodus gekozen en wordt er automatisch een token gegenereerd, opgeslagen in `gateway.auth.token`, dus **lokale WS-clients moeten authenticeren**. Dit blokkeert andere lokale processen om de Gateway aan te roepen.

    Als je liever een ander authpad gebruikt, kun je expliciet wachtwoordmodus kiezen (of, voor identity-aware reverse proxies, `trusted-proxy`). Als je **echt** open loopback wilt, stel dan expliciet `gateway.auth.mode: "none"` in je config in. Doctor kan op elk moment een token voor je genereren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Moet ik herstarten na het wijzigen van config?">
    De Gateway bewaakt de config en ondersteunt hot-reload:

    - `gateway.reload.mode: "hybrid"` (standaard): veilige wijzigingen direct toepassen, herstarten voor kritieke wijzigingen
    - `hot`, `restart`, `off` worden ook ondersteund

  </Accordion>

  <Accordion title="Hoe schakel ik grappige CLI-taglines uit?">
    Stel `cli.banner.taglineMode` in config in:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: verbergt taglinetekst maar behoudt de banner-titel-/versieregel.
    - `default`: gebruikt elke keer `All your chats, one OpenClaw.`.
    - `random`: roterende grappige/seizoensgebonden taglines (standaardgedrag).
    - Als je helemaal geen banner wilt, stel dan env `OPENCLAW_HIDE_BANNER=1` in.

  </Accordion>

  <Accordion title="Hoe schakel ik webzoekfunctie (en web ophalen) in?">
    `web_fetch` werkt zonder API-sleutel. `web_search` hangt af van je geselecteerde
    provider:

    - API-ondersteunde providers zoals Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity en Tavily vereisen hun normale API-sleutelconfiguratie.
    - Ollama Web Search is zonder sleutel, maar gebruikt je geconfigureerde Ollama-host en vereist `ollama signin`.
    - DuckDuckGo is zonder sleutel, maar is een onofficiële HTML-gebaseerde integratie.
    - SearXNG is zonder sleutel/zelf gehost; configureer `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Aanbevolen:** voer `openclaw configure --section web` uit en kies een provider.
    Omgevingsalternatieven:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
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

    Providerspecifieke webzoekconfiguratie staat nu onder `plugins.entries.<plugin>.config.webSearch.*`.
    Verouderde providerpaden `tools.web.search.*` worden tijdelijk nog geladen voor compatibiliteit, maar ze mogen niet worden gebruikt voor nieuwe configuraties.
    Firecrawl-webfetchfallbackconfiguratie staat onder `plugins.entries.firecrawl.config.webFetch.*`.

    Opmerkingen:

    - Als je allowlists gebruikt, voeg dan `web_search`/`web_fetch`/`x_search` of `group:web` toe.
    - `web_fetch` is standaard ingeschakeld (tenzij expliciet uitgeschakeld).
    - Als `tools.web.fetch.provider` wordt weggelaten, detecteert OpenClaw automatisch de eerste beschikbare fetchfallbackprovider op basis van beschikbare referenties. Op dit moment is de meegeleverde provider Firecrawl.
    - Daemons lezen env-vars uit `~/.openclaw/.env` (of de serviceomgeving).

    Docs: [Webtools](/nl/tools/web).

  </Accordion>

  <Accordion title="config.apply heeft mijn configuratie gewist. Hoe herstel ik dit en voorkom ik het?">
    `config.apply` vervangt de **volledige configuratie**. Als je een gedeeltelijk object verzendt, wordt al het
    andere verwijderd.

    De huidige OpenClaw beschermt tegen veel onbedoelde overschrijvingen:

    - Configuratiewijzigingen die door OpenClaw worden beheerd, valideren de volledige configuratie na de wijziging voordat er wordt geschreven.
    - Ongeldige of destructieve schrijfacties die door OpenClaw worden beheerd, worden geweigerd en opgeslagen als `openclaw.json.rejected.*`.
    - Als een directe bewerking het opstarten of hot reload breekt, herstelt de Gateway de laatst bekende werkende configuratie en slaat het geweigerde bestand op als `openclaw.json.clobbered.*`.
    - De hoofdagent ontvangt na herstel een opstartwaarschuwing zodat deze de slechte configuratie niet blind opnieuw wegschrijft.

    Herstellen:

    - Controleer `openclaw logs --follow` op `Config auto-restored from last-known-good`, `Config write rejected:`, of `config reload restored last-known-good config`.
    - Inspecteer de nieuwste `openclaw.json.clobbered.*` of `openclaw.json.rejected.*` naast de actieve configuratie.
    - Behoud de actieve herstelde configuratie als die werkt en kopieer daarna alleen de bedoelde sleutels terug met `openclaw config set` of `config.patch`.
    - Voer `openclaw config validate` en `openclaw doctor` uit.
    - Als je geen laatst bekende werkende configuratie of geweigerde payload hebt, herstel dan vanuit een back-up, of voer `openclaw doctor` opnieuw uit en configureer kanalen/modellen opnieuw.
    - Als dit onverwacht was, dien dan een bugrapport in en voeg je laatst bekende configuratie of een back-up toe.
    - Een lokale coding-agent kan vaak een werkende configuratie reconstrueren uit logs of geschiedenis.

    Voorkomen:

    - Gebruik `openclaw config set` voor kleine wijzigingen.
    - Gebruik `openclaw configure` voor interactieve bewerkingen.
    - Gebruik eerst `config.schema.lookup` als je niet zeker bent van een exact pad of de vorm van een veld; dit retourneert een oppervlakkige schemaknoop plus samenvattingen van directe kinderen voor verder doorklikken.
    - Gebruik `config.patch` voor gedeeltelijke RPC-bewerkingen; gebruik `config.apply` alleen voor vervanging van de volledige configuratie.
    - Als je de owner-only `gateway`-tool vanuit een agent-run gebruikt, weigert die nog steeds schrijfacties naar `tools.exec.ask` / `tools.exec.security` (inclusief verouderde `tools.bash.*`-aliassen die normaliseren naar dezelfde beschermde exec-paden).

    Docs: [Configuratie](/nl/cli/config), [Configureren](/nl/cli/configure), [Gateway-probleemoplossing](/nl/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/nl/gateway/doctor).

  </Accordion>

  <Accordion title="Hoe voer ik een centrale Gateway uit met gespecialiseerde workers op meerdere apparaten?">
    Het gebruikelijke patroon is **één Gateway** (bijv. Raspberry Pi) plus **nodes** en **agenten**:

    - **Gateway (centraal):** beheert kanalen (Signal/WhatsApp), routering en sessies.
    - **Nodes (apparaten):** Macs/iOS/Android maken verbinding als randapparaten en stellen lokale tools beschikbaar (`system.run`, `canvas`, `camera`).
    - **Agenten (workers):** afzonderlijke breinen/workspaces voor speciale rollen (bijv. "Hetzner-ops", "Persoonlijke data").
    - **Subagenten:** starten achtergrondwerk vanuit een hoofdagent wanneer je parallellisme wilt.
    - **TUI:** maak verbinding met de Gateway en wissel tussen agenten/sessies.

    Docs: [Nodes](/nl/nodes), [Toegang op afstand](/nl/gateway/remote), [Multi-Agent-routering](/nl/concepts/multi-agent), [Subagenten](/nl/tools/subagents), [TUI](/nl/web/tui).

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

    Headless gebruikt dezelfde **Chromium-engine** en werkt voor de meeste automatisering (formulieren, klikken, scraping, aanmeldingen). De belangrijkste verschillen:

    - Geen zichtbaar browservenster (gebruik screenshots als je visuele feedback nodig hebt).
    - Sommige sites zijn strenger voor automatisering in headless-modus (CAPTCHA's, anti-bot).
      X/Twitter blokkeert bijvoorbeeld vaak headless-sessies.

  </Accordion>

  <Accordion title="Hoe gebruik ik Brave voor browserbesturing?">
    Stel `browser.executablePath` in op je Brave-binary (of een andere Chromium-gebaseerde browser) en herstart de Gateway.
    Zie de volledige configuratievoorbeelden in [Browser](/nl/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways en nodes op afstand

<AccordionGroup>
  <Accordion title="Hoe worden opdrachten doorgegeven tussen Telegram, de gateway en nodes?">
    Telegram-berichten worden verwerkt door de **gateway**. De gateway voert de agent uit en
    roept pas daarna nodes aan via de **Gateway WebSocket** wanneer een node-tool nodig is:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes zien geen inkomend providerverkeer; ze ontvangen alleen node-RPC-aanroepen.

  </Accordion>

  <Accordion title="Hoe kan mijn agent toegang krijgen tot mijn computer als de Gateway extern wordt gehost?">
    Kort antwoord: **koppel je computer als node**. De Gateway draait elders, maar kan
    `node.*`-tools (scherm, camera, systeem) op je lokale machine aanroepen via de Gateway WebSocket.

    Typische setup:

    1. Voer de Gateway uit op de altijd-aan-host (VPS/thuisserver).
    2. Zet de Gateway-host en je computer op dezelfde tailnet.
    3. Zorg dat de Gateway-WS bereikbaar is (tailnet-bind of SSH-tunnel).
    4. Open de macOS-app lokaal en verbind in de modus **Remote over SSH** (of directe tailnet)
       zodat deze zich als node kan registreren.
    5. Keur de node goed op de Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Er is geen aparte TCP-bridge vereist; nodes verbinden via de Gateway WebSocket.

    Beveiligingsherinnering: het koppelen van een macOS-node staat `system.run` toe op die machine. Koppel alleen
    apparaten die je vertrouwt en bekijk [Beveiliging](/nl/gateway/security).

    Docs: [Nodes](/nl/nodes), [Gateway-protocol](/nl/gateway/protocol), [macOS-modus op afstand](/nl/platforms/mac/remote), [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Tailscale is verbonden, maar ik krijg geen antwoorden. Wat nu?">
    Controleer de basis:

    - Gateway draait: `openclaw gateway status`
    - Gateway-status: `openclaw status`
    - Kanaalstatus: `openclaw channels status`

    Controleer daarna authenticatie en routering:

    - Als je Tailscale Serve gebruikt, zorg dan dat `gateway.auth.allowTailscale` correct is ingesteld.
    - Als je via een SSH-tunnel verbindt, controleer dan of de lokale tunnel actief is en naar de juiste poort wijst.
    - Controleer of je allowlists (DM of groep) je account bevatten.

    Docs: [Tailscale](/nl/gateway/tailscale), [Toegang op afstand](/nl/gateway/remote), [Kanalen](/nl/channels).

  </Accordion>

  <Accordion title="Kunnen twee OpenClaw-instanties met elkaar praten (lokaal + VPS)?">
    Ja. Er is geen ingebouwde "bot-naar-bot"-bridge, maar je kunt dit op een paar
    betrouwbare manieren aansluiten:

    **Eenvoudigst:** gebruik een normaal chatkanaal waartoe beide bots toegang hebben (Telegram/Slack/WhatsApp).
    Laat Bot A een bericht sturen naar Bot B en laat Bot B daarna zoals gebruikelijk antwoorden.

    **CLI-bridge (generiek):** voer een script uit dat de andere Gateway aanroept met
    `openclaw agent --message ... --deliver`, gericht op een chat waarin de andere bot
    luistert. Als één bot op een externe VPS staat, wijs je CLI dan naar die externe Gateway
    via SSH/Tailscale (zie [Toegang op afstand](/nl/gateway/remote)).

    Voorbeeldpatroon (uitvoeren vanaf een machine die de doel-Gateway kan bereiken):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: voeg een vangrail toe zodat de twee bots niet eindeloos blijven loopen (alleen bij vermelding, kanaal-
    allowlists, of een regel "niet antwoorden op botberichten").

    Docs: [Toegang op afstand](/nl/gateway/remote), [Agent-CLI](/nl/cli/agent), [Agent verzenden](/nl/tools/agent-send).

  </Accordion>

  <Accordion title="Heb ik aparte VPS'en nodig voor meerdere agenten?">
    Nee. Eén Gateway kan meerdere agenten hosten, elk met een eigen workspace, modelstandaarden
    en routering. Dat is de normale setup en is veel goedkoper en eenvoudiger dan
    één VPS per agent draaien.

    Gebruik aparte VPS'en alleen wanneer je harde isolatie nodig hebt (beveiligingsgrenzen) of zeer
    verschillende configuraties die je niet wilt delen. Houd anders één Gateway aan en
    gebruik meerdere agenten of subagenten.

  </Accordion>

  <Accordion title="Heeft het voordeel om een node op mijn persoonlijke laptop te gebruiken in plaats van SSH vanaf een VPS?">
    Ja - nodes zijn de eersteklas manier om je laptop vanaf een externe Gateway te bereiken, en ze
    bieden meer dan shelltoegang. De Gateway draait op macOS/Linux (Windows via WSL2) en is
    lichtgewicht (een kleine VPS of Raspberry Pi-klasse machine is prima; 4 GB RAM is ruim voldoende), dus een gebruikelijke
    setup is een altijd-aan-host plus je laptop als node.

    - **Geen inkomende SSH vereist.** Nodes verbinden uitgaand met de Gateway WebSocket en gebruiken apparaatkoppeling.
    - **Veiligere uitvoeringscontroles.** `system.run` wordt op die laptop begrensd door node-allowlists/goedkeuringen.
    - **Meer apparaattools.** Nodes stellen naast `system.run` ook `canvas`, `camera` en `screen` beschikbaar.
    - **Lokale browserautomatisering.** Houd de Gateway op een VPS, maar voer Chrome lokaal uit via een node-host op de laptop, of koppel aan lokale Chrome op de host via Chrome MCP.

    SSH is prima voor ad-hoc shelltoegang, maar nodes zijn eenvoudiger voor doorlopende agentworkflows en
    apparaatautomatisering.

    Docs: [Nodes](/nl/nodes), [Nodes-CLI](/nl/cli/nodes), [Browser](/nl/tools/browser).

  </Accordion>

  <Accordion title="Draaien nodes een gatewayservice?">
    Nee. Er mag slechts **één gateway** per host draaien, tenzij je bewust geïsoleerde profielen uitvoert (zie [Meerdere gateways](/nl/gateway/multiple-gateways)). Nodes zijn randapparaten die verbinding maken
    met de gateway (iOS/Android-nodes, of macOS-"node mode" in de menubalk-app). Zie [Node-host-CLI](/nl/cli/node) voor headless node-
    hosts en CLI-besturing.

    Een volledige herstart is vereist voor wijzigingen aan `gateway`, `discovery` en `canvasHost`.

  </Accordion>

  <Accordion title="Is er een API-/RPC-manier om configuratie toe te passen?">
    Ja.

    - `config.schema.lookup`: inspecteer één configuratiesubboom met de oppervlakkige schemaknoop, overeenkomende UI-hint en samenvattingen van directe kinderen voordat je schrijft
    - `config.get`: haal de huidige snapshot + hash op
    - `config.patch`: veilige gedeeltelijke update (aanbevolen voor de meeste RPC-bewerkingen); voert hot reload uit waar mogelijk en herstart wanneer vereist
    - `config.apply`: valideer en vervang de volledige configuratie; voert hot reload uit waar mogelijk en herstart wanneer vereist
    - De owner-only runtime-tool `gateway` weigert nog steeds `tools.exec.ask` / `tools.exec.security` te herschrijven; verouderde `tools.bash.*`-aliassen normaliseren naar dezelfde beschermde exec-paden

  </Accordion>

  <Accordion title="Minimale verstandige config voor een eerste installatie">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dit stelt je werkruimte in en beperkt wie de bot kan activeren.

  </Accordion>

  <Accordion title="Hoe stel ik Tailscale in op een VPS en maak ik verbinding vanaf mijn Mac?">
    Minimale stappen:

    1. **Installeer + log in op de VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installeer + log in op je Mac**
       - Gebruik de Tailscale-app en meld je aan bij hetzelfde tailnet.
    3. **Schakel MagicDNS in (aanbevolen)**
       - Schakel MagicDNS in de Tailscale-beheerconsole in, zodat de VPS een stabiele naam heeft.
    4. **Gebruik de tailnet-hostnaam**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Als je de Control UI zonder SSH wilt, gebruik dan Tailscale Serve op de VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dit houdt de Gateway gebonden aan loopback en stelt HTTPS beschikbaar via Tailscale. Zie [Tailscale](/nl/gateway/tailscale).

  </Accordion>

  <Accordion title="Hoe verbind ik een Mac-Node met een externe Gateway (Tailscale Serve)?">
    Serve stelt de **Gateway Control UI + WS** beschikbaar. Nodes verbinden via hetzelfde Gateway WS-eindpunt.

    Aanbevolen configuratie:

    1. **Zorg dat de VPS + Mac op hetzelfde tailnet zitten**.
    2. **Gebruik de macOS-app in Remote-modus** (SSH-doel kan de tailnet-hostnaam zijn).
       De app tunnelt de Gateway-poort en maakt verbinding als een Node.
    3. **Keur de Node goed** op de Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Gateway-protocol](/nl/gateway/protocol), [Detectie](/nl/gateway/discovery), [macOS Remote-modus](/nl/platforms/mac/remote).

  </Accordion>

  <Accordion title="Moet ik installeren op een tweede laptop of gewoon een Node toevoegen?">
    Als je alleen **lokale tools** (scherm/camera/exec) op de tweede laptop nodig hebt, voeg die dan toe als een
    **Node**. Daarmee behoud je één Gateway en voorkom je dubbele config. Lokale Node-tools zijn
    momenteel alleen voor macOS, maar we zijn van plan ze uit te breiden naar andere besturingssystemen.

    Installeer alleen een tweede Gateway wanneer je **harde isolatie** of twee volledig gescheiden bots nodig hebt.

    Docs: [Nodes](/nl/nodes), [Nodes-CLI](/nl/cli/nodes), [Meerdere Gateways](/nl/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Omgevingsvariabelen en .env laden

<AccordionGroup>
  <Accordion title="Hoe laadt OpenClaw omgevingsvariabelen?">
    OpenClaw leest omgevingsvariabelen uit het bovenliggende proces (shell, launchd/systemd, CI, enz.) en laadt daarnaast:

    - `.env` uit de huidige werkmap
    - een globale fallback-`.env` uit `~/.openclaw/.env` (ook wel `$OPENCLAW_STATE_DIR/.env`)

    Geen van beide `.env`-bestanden overschrijft bestaande omgevingsvariabelen.

    Je kunt ook inline omgevingsvariabelen in de config definiëren (alleen toegepast als ze ontbreken in de procesomgeving):

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

    1. Zet de ontbrekende sleutels in `~/.openclaw/.env`, zodat ze worden opgepikt, zelfs wanneer de service je shell-omgeving niet erft.
    2. Schakel shell-import in (opt-in gemak):

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

    Dit voert je login-shell uit en importeert alleen ontbrekende verwachte sleutels (overschrijft nooit). Equivalenten voor omgevingsvariabelen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ik heb COPILOT_GITHUB_TOKEN ingesteld, maar de modellenstatus toont "Shell env: off." Waarom?'>
    `openclaw models status` meldt of **shell-env-import** is ingeschakeld. "Shell env: off"
    betekent **niet** dat je omgevingsvariabelen ontbreken - het betekent alleen dat OpenClaw
    je login-shell niet automatisch laadt.

    Als de Gateway als service draait (launchd/systemd), erft die je shell-
    omgeving niet. Los dit op door een van deze dingen te doen:

    1. Zet het token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Of schakel shell-import in (`env.shellEnv.enabled: true`).
    3. Of voeg het toe aan het `env`-blok van je config (wordt alleen toegepast als het ontbreekt).

    Start daarna de Gateway opnieuw en controleer opnieuw:

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
    Stel dit in op een positieve waarde om verlopen bij inactiviteit in te schakelen. Wanneer dit is ingeschakeld, start het **volgende**
    bericht na de inactieve periode een nieuw sessie-id voor die chatsleutel.
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
    Ja, via **multi-agent-routering** en **sub-agents**. Je kunt één coördinator-
    agent en meerdere werk-agenten maken met hun eigen werkruimtes en modellen.

    Dat gezegd hebbende, kun je dit het best zien als een **leuk experiment**. Het gebruikt veel tokens en is vaak
    minder efficiënt dan één bot gebruiken met afzonderlijke sessies. Het typische model dat we
    voor ons zien is één bot waarmee je praat, met verschillende sessies voor parallel werk. Die
    bot kan ook sub-agents starten wanneer dat nodig is.

    Docs: [Multi-agent-routering](/nl/concepts/multi-agent), [Sub-agents](/nl/tools/subagents), [Agents-CLI](/nl/cli/agents).

  </Accordion>

  <Accordion title="Waarom werd context midden in een taak afgekapt? Hoe voorkom ik dat?">
    Sessiecontext wordt beperkt door het modelvenster. Lange chats, grote tooluitvoer of veel
    bestanden kunnen Compaction of truncatie activeren.

    Wat helpt:

    - Vraag de bot de huidige status samen te vatten en naar een bestand te schrijven.
    - Gebruik `/compact` vóór lange taken en `/new` wanneer je van onderwerp wisselt.
    - Houd belangrijke context in de werkruimte en vraag de bot die terug te lezen.
    - Gebruik sub-agents voor lang of parallel werk, zodat de hoofdchat kleiner blijft.
    - Kies een model met een groter contextvenster als dit vaak gebeurt.

  </Accordion>

  <Accordion title="Hoe reset ik OpenClaw volledig, maar houd ik het geïnstalleerd?">
    Gebruik de reset-opdracht:

    ```bash
    openclaw reset
    ```

    Niet-interactieve volledige reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Voer daarna de setup opnieuw uit:

    ```bash
    openclaw onboard --install-daemon
    ```

    Opmerkingen:

    - Onboarding biedt ook **Reset** aan als er een bestaande config wordt gevonden. Zie [Onboarding (CLI)](/nl/start/wizard).
    - Als je profielen hebt gebruikt (`--profile` / `OPENCLAW_PROFILE`), reset dan elke statusmap (standaardwaarden zijn `~/.openclaw-<profile>`).
    - Dev-reset: `openclaw gateway --dev --reset` (alleen dev; wist dev-config + referenties + sessies + werkruimte).

  </Accordion>

  <Accordion title='Ik krijg fouten "context too large" - hoe reset of compact ik?'>
    Gebruik een van deze opties:

    - **Compact** (behoudt het gesprek, maar vat oudere beurten samen):

      ```
      /compact
      ```

      of `/compact <instructions>` om de samenvatting te sturen.

    - **Reset** (nieuw sessie-ID voor dezelfde chatsleutel):

      ```
      /new
      /reset
      ```

    Als het blijft gebeuren:

    - Schakel **sessie-opschoning** (`agents.defaults.contextPruning`) in of stem die af om oude tooluitvoer in te korten.
    - Gebruik een model met een groter contextvenster.

    Docs: [Compaction](/nl/concepts/compaction), [Sessie-opschoning](/nl/concepts/session-pruning), [Sessiebeheer](/nl/concepts/session).

  </Accordion>

  <Accordion title='Waarom zie ik "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dit is een provider-validatiefout: het model heeft een `tool_use`-blok uitgegeven zonder de vereiste
    `input`. Dit betekent meestal dat de sessiegeschiedenis verouderd of beschadigd is (vaak na lange threads
    of een wijziging in tool/schema).

    Oplossing: start een nieuwe sessie met `/new` (zelfstandig bericht).

  </Accordion>

  <Accordion title="Waarom krijg ik elke 30 minuten Heartbeat-berichten?">
    Heartbeats draaien standaard elke **30m** (**1h** bij gebruik van OAuth-authenticatie). Pas ze aan of schakel ze uit:

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

    Als `HEARTBEAT.md` bestaat maar feitelijk leeg is (alleen lege regels en markdown-
    koppen zoals `# Heading`), slaat OpenClaw de Heartbeat-run over om API-aanroepen te besparen.
    Als het bestand ontbreekt, draait de Heartbeat nog steeds en beslist het model wat te doen.

    Per-agent overrides gebruiken `agents.list[].heartbeat`. Docs: [Heartbeat](/nl/gateway/heartbeat).

  </Accordion>

  <Accordion title='Moet ik een "bot account" toevoegen aan een WhatsApp-groep?'>
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

    Optie 2 (als al geconfigureerd/toegestaan): toon groepen uit de config:

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
    Directe chats worden standaard samengevoegd met de hoofdsessie. Groepen/kanalen hebben hun eigen sessiesleutels, en Telegram-onderwerpen / Discord-threads zijn afzonderlijke sessies. Zie [Groepen](/nl/channels/groups) en [Groepsberichten](/nl/channels/group-messages).
  </Accordion>

  <Accordion title="Hoeveel werkruimtes en agents kan ik maken?">
    Geen harde limieten. Tientallen (zelfs honderden) zijn prima, maar let op:

    - **Schijfgroei:** sessies + transcripties staan onder `~/.openclaw/agents/<agentId>/sessions/`.
    - **Tokenkosten:** meer agents betekent meer gelijktijdig modelgebruik.
    - **Operationele overhead:** auth-profielen, werkruimtes en kanaalroutering per agent.

    Tips:

    - Houd één **actieve** werkruimte per agent (`agents.defaults.workspace`).
    - Ruim oude sessies op (verwijder JSONL- of store-vermeldingen) als de schijf groeit.
    - Gebruik `openclaw doctor` om verdwaalde werkruimtes en profielmismatches te vinden.

  </Accordion>

  <Accordion title="Kan ik meerdere bots of chats tegelijk uitvoeren (Slack), en hoe moet ik dat instellen?">
    Ja. Gebruik **Routering voor meerdere agents** om meerdere geïsoleerde agents uit te voeren en inkomende berichten te routeren op basis van
    kanaal/account/peer. Slack wordt ondersteund als kanaal en kan aan specifieke agents worden gekoppeld.

    Browsertoegang is krachtig, maar niet "alles kunnen doen wat een mens kan" - anti-botmaatregelen, CAPTCHA's en MFA kunnen
    automatisering nog steeds blokkeren. Gebruik voor de betrouwbaarste browserbesturing lokale Chrome MCP op de host,
    of gebruik CDP op de machine waarop de browser daadwerkelijk draait.

    Aanbevolen instelling:

    - Altijd actieve Gateway-host (VPS/Mac mini).
    - Eén agent per rol (koppelingen).
    - Slack-kanaal(en) gekoppeld aan die agents.
    - Lokale browser via Chrome MCP of een node wanneer nodig.

    Documentatie: [Routering voor meerdere agents](/nl/concepts/multi-agent), [Slack](/nl/channels/slack),
    [Browser](/nl/tools/browser), [Nodes](/nl/nodes).

  </Accordion>
</AccordionGroup>

## Modellen, failover en auth-profielen

Vragen en antwoorden over modellen — standaardinstellingen, selectie, aliassen, wisselen, failover, auth-profielen —
staan in de [FAQ over modellen](/nl/help/faq-models).

## Gateway: poorten, "already running" en externe modus

<AccordionGroup>
  <Accordion title="Welke poort gebruikt de Gateway?">
    `gateway.port` beheert de enkele gemultiplexte poort voor WebSocket + HTTP (Control UI, hooks, enzovoort).

    Prioriteit:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Waarom zegt openclaw gateway status "Runtime: running" maar "Connectivity probe: failed"?'>
    Omdat "running" de weergave van de **supervisor** is (launchd/systemd/schtasks). De verbindingsprobe is de CLI die daadwerkelijk verbinding maakt met de gateway-WebSocket.

    Gebruik `openclaw gateway status` en vertrouw op deze regels:

    - `Probe target:` (de URL die de probe daadwerkelijk gebruikte)
    - `Listening:` (wat daadwerkelijk aan de poort is gekoppeld)
    - `Last gateway error:` (veelvoorkomende hoofdoorzaak wanneer het proces actief is maar de poort niet luistert)

  </Accordion>

  <Accordion title='Waarom toont openclaw gateway status verschillende waarden voor "Config (cli)" en "Config (service)"?'>
    Je bewerkt één configuratiebestand terwijl de service een ander gebruikt (vaak een mismatch met `--profile` / `OPENCLAW_STATE_DIR`).

    Oplossing:

    ```bash
    openclaw gateway install --force
    ```

    Voer dat uit vanuit hetzelfde `--profile` / dezelfde omgeving die je door de service wilt laten gebruiken.

  </Accordion>

  <Accordion title='Wat betekent "another gateway instance is already listening"?'>
    OpenClaw dwingt een runtime-lock af door de WebSocket-listener direct bij het opstarten te binden (standaard `ws://127.0.0.1:18789`). Als de binding mislukt met `EADDRINUSE`, wordt `GatewayLockError` gegooid om aan te geven dat een andere instance al luistert.

    Oplossing: stop de andere instance, maak de poort vrij, of voer uit met `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Hoe voer ik OpenClaw uit in externe modus (client maakt verbinding met een Gateway elders)?">
    Stel `gateway.mode: "remote"` in en verwijs naar een externe WebSocket-URL, optioneel met externe inloggegevens met gedeeld geheim:

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
    - De macOS-app bewaakt het configuratiebestand en wisselt live van modus wanneer deze waarden wijzigen.
    - `gateway.remote.token` / `.password` zijn alleen externe clientinloggegevens; ze schakelen lokale gateway-auth niet vanzelf in.

  </Accordion>

  <Accordion title='De Control UI zegt "unauthorized" (of blijft opnieuw verbinden). Wat nu?'>
    Je gateway-authpad en de auth-methode van de UI komen niet overeen.

    Feiten (uit de code):

    - De Control UI bewaart de token in `sessionStorage` voor de huidige browsertabsessie en geselecteerde gateway-URL, zodat verversen in dezelfde tab blijft werken zonder langdurige tokenpersistentie in localStorage te herstellen.
    - Bij `AUTH_TOKEN_MISMATCH` kunnen vertrouwde clients één begrensde nieuwe poging doen met een gecachete apparaattoken wanneer de gateway retry-hints teruggeeft (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Die retry met gecachete token hergebruikt nu de gecachete goedgekeurde scopes die met de apparaattoken zijn opgeslagen. Callers met expliciete `deviceToken` / expliciete `scopes` behouden nog steeds hun aangevraagde scopeset in plaats van gecachete scopes te erven.
    - Buiten dat retrypad is de prioriteit voor verbindingsauth eerst expliciete gedeelde token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken, daarna bootstrap-token.
    - Scopecontroles voor bootstrap-tokens hebben rolprefixen. De ingebouwde allowlist voor bootstrap-operators voldoet alleen aan operatorverzoeken; node- of andere niet-operatorrollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

    Oplossing:

    - Snelst: `openclaw dashboard` (print + kopieert de dashboard-URL, probeert te openen; toont SSH-hint als de host headless is).
    - Als je nog geen token hebt: `openclaw doctor --generate-gateway-token`.
    - Indien extern, tunnel eerst: `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`.
    - Modus met gedeeld geheim: stel `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` in en plak daarna het overeenkomende geheim in de instellingen van de Control UI.
    - Tailscale Serve-modus: zorg dat `gateway.auth.allowTailscale` is ingeschakeld en dat je de Serve-URL opent, niet een ruwe loopback-/tailnet-URL die Tailscale-identiteitsheaders omzeilt.
    - Trusted-proxy-modus: zorg dat je via de geconfigureerde identiteitsbewuste proxy binnenkomt, niet via een ruwe gateway-URL. Loopbackproxy's op dezelfde host hebben ook `gateway.auth.trustedProxy.allowLoopback = true` nodig.
    - Als de mismatch na die ene retry blijft bestaan, roteer/keur de gekoppelde apparaattoken opnieuw goed:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Als die roteer-aanroep zegt dat deze is geweigerd, controleer dan twee dingen:
      - gekoppelde apparaatsessies kunnen alleen hun **eigen** apparaat roteren, tenzij ze ook `operator.admin` hebben
      - expliciete `--scope`-waarden mogen de huidige operatorscopes van de caller niet overschrijden
    - Nog steeds vast? Voer `openclaw status --all` uit en volg [Probleemoplossing](/nl/gateway/troubleshooting). Zie [Dashboard](/nl/web/dashboard) voor auth-details.

  </Accordion>

  <Accordion title="Ik heb gateway.bind ingesteld op tailnet, maar deze kan niet binden en niets luistert">
    `tailnet`-binding kiest een Tailscale-IP uit je netwerkinterfaces (100.64.0.0/10). Als de machine niet op Tailscale zit (of de interface down is), is er niets om aan te binden.

    Oplossing:

    - Start Tailscale op die host (zodat deze een 100.x-adres heeft), of
    - Schakel over naar `gateway.bind: "loopback"` / `"lan"`.

    Opmerking: `tailnet` is expliciet. `auto` geeft de voorkeur aan loopback; gebruik `gateway.bind: "tailnet"` wanneer je alleen aan tailnet wilt binden.

  </Accordion>

  <Accordion title="Kan ik meerdere Gateways op dezelfde host uitvoeren?">
    Meestal niet - één Gateway kan meerdere berichtenkanalen en agents uitvoeren. Gebruik meerdere Gateways alleen wanneer je redundantie nodig hebt (bijvoorbeeld: reddingsbot) of strikte isolatie.

    Ja, maar je moet isoleren:

    - `OPENCLAW_CONFIG_PATH` (configuratie per instance)
    - `OPENCLAW_STATE_DIR` (state per instance)
    - `agents.defaults.workspace` (workspace-isolatie)
    - `gateway.port` (unieke poorten)

    Snelle instelling (aanbevolen):

    - Gebruik `openclaw --profile <name> ...` per instance (maakt automatisch `~/.openclaw-<name>` aan).
    - Stel een unieke `gateway.port` in elke profielconfiguratie in (of geef `--port` mee voor handmatige runs).
    - Installeer een service per profiel: `openclaw --profile <name> gateway install`.

    Profielen voegen ook een suffix toe aan servicenamen (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Volledige gids: [Meerdere gateways](/nl/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Wat betekent "invalid handshake" / code 1008?'>
    De Gateway is een **WebSocket-server**, en verwacht dat het allereerste bericht
    een `connect`-frame is. Als deze iets anders ontvangt, sluit deze de verbinding
    met **code 1008** (beleidsschending).

    Veelvoorkomende oorzaken:

    - Je hebt de **HTTP**-URL in een browser geopend (`http://...`) in plaats van een WS-client.
    - Je hebt de verkeerde poort of het verkeerde pad gebruikt.
    - Een proxy of tunnel heeft auth-headers gestript of een niet-Gateway-verzoek verzonden.

    Snelle oplossingen:

    1. Gebruik de WS-URL: `ws://<host>:18789` (of `wss://...` bij HTTPS).
    2. Open de WS-poort niet in een normale browsertab.
    3. Als auth aan staat, neem de token/het wachtwoord op in het `connect`-frame.

    Als je de CLI of TUI gebruikt, moet de URL er zo uitzien:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protocoldetails: [Gateway-protocol](/nl/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging en debuggen

<AccordionGroup>
  <Accordion title="Waar staan logs?">
    Bestandslogs (gestructureerd):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Je kunt een stabiel pad instellen via `logging.file`. Het logniveau voor bestanden wordt beheerd door `logging.level`. Console-uitvoerigheid wordt beheerd door `--verbose` en `logging.consoleLevel`.

    Snelste log-tail:

    ```bash
    openclaw logs --follow
    ```

    Service-/supervisorlogs (wanneer de gateway via launchd/systemd draait):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` en `gateway.err.log` (standaard: `~/.openclaw/logs/...`; profielen gebruiken `~/.openclaw-<profile>/logs/...`)
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

    Als je de gateway handmatig uitvoert, kan `openclaw gateway --force` de poort terugwinnen. Zie [Gateway](/nl/gateway).

  </Accordion>

  <Accordion title="Ik heb mijn terminal op Windows gesloten - hoe herstart ik OpenClaw?">
    Er zijn **twee Windows-installatiemodi**:

    **1) WSL2 (aanbevolen):** de Gateway draait binnen Linux.

    Open PowerShell, ga naar WSL en herstart dan:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Als je de service nooit hebt geïnstalleerd, start deze dan op de voorgrond:

    ```bash
    openclaw gateway run
    ```

    **2) Native Windows (niet aanbevolen):** de Gateway draait rechtstreeks in Windows.

    Open PowerShell en voer uit:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Als je deze handmatig uitvoert (geen service), gebruik:

    ```powershell
    openclaw gateway run
    ```

    Documentatie: [Windows (WSL2)](/nl/platforms/windows), [Runbook voor Gateway-service](/nl/gateway).

  </Accordion>

  <Accordion title="De Gateway is actief maar antwoorden komen nooit aan. Wat moet ik controleren?">
    Begin met een snelle gezondheidscontrole:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Veelvoorkomende oorzaken:

    - Modelauth is niet geladen op de **gateway-host** (controleer `models status`).
    - Kanaalkoppeling/allowlist blokkeert antwoorden (controleer kanaalconfiguratie + logs).
    - WebChat/Dashboard is geopend zonder de juiste token.

    Als je extern werkt, bevestig dan dat de tunnel-/Tailscale-verbinding actief is en dat de
    Gateway-WebSocket bereikbaar is.

    Documentatie: [Kanalen](/nl/channels), [Probleemoplossing](/nl/gateway/troubleshooting), [Externe toegang](/nl/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - wat nu?'>
    Dit betekent meestal dat de UI de WebSocket-verbinding heeft verloren. Controleer:

    1. Draait de Gateway? `openclaw gateway status`
    2. Is de Gateway gezond? `openclaw status`
    3. Heeft de UI het juiste token? `openclaw dashboard`
    4. Als dit extern is, is de tunnel-/Tailscale-verbinding actief?

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

    - `BOT_COMMANDS_TOO_MUCH`: het Telegram-menu heeft te veel items. OpenClaw kapt al af tot de Telegram-limiet en probeert het opnieuw met minder opdrachten, maar sommige menu-items moeten nog steeds worden verwijderd. Verminder Plugin-/Skill-/aangepaste opdrachten, of schakel `channels.telegram.commands.native` uit als je het menu niet nodig hebt.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, of vergelijkbare netwerkfouten: als je op een VPS zit of achter een proxy werkt, controleer dan of uitgaande HTTPS is toegestaan en DNS werkt voor `api.telegram.org`.

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

    Gebruik in de TUI `/status` om de huidige status te bekijken. Als je antwoorden in een chatkanaal verwacht,
    zorg er dan voor dat bezorging is ingeschakeld (`/deliver on`).

    Docs: [TUI](/nl/web/tui), [Slash-opdrachten](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Hoe stop ik de Gateway volledig en start ik die daarna opnieuw?">
    Als je de service hebt geïnstalleerd:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dit stopt/start de **bewaakte service** (launchd op macOS, systemd op Linux).
    Gebruik dit wanneer de Gateway op de achtergrond als daemon draait.

    Als je op de voorgrond draait, stop dan met Ctrl-C en voer daarna uit:

    ```bash
    openclaw gateway run
    ```

    Docs: [Gateway-service-runbook](/nl/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart versus openclaw gateway">
    - `openclaw gateway restart`: herstart de **achtergrondservice** (launchd/systemd).
    - `openclaw gateway`: draait de gateway **op de voorgrond** voor deze terminalsessie.

    Als je de service hebt geïnstalleerd, gebruik dan de gateway-opdrachten. Gebruik `openclaw gateway` wanneer
    je een eenmalige run op de voorgrond wilt.

  </Accordion>

  <Accordion title="Snelste manier om meer details te krijgen wanneer iets mislukt">
    Start de Gateway met `--verbose` om meer consoledetails te krijgen. Inspecteer daarna het logbestand op kanaalauthenticatie, modelroutering en RPC-fouten.
  </Accordion>
</AccordionGroup>

## Media en bijlagen

<AccordionGroup>
  <Accordion title="Mijn Skill heeft een afbeelding/PDF gegenereerd, maar er is niets verzonden">
    Uitgaande bijlagen van de agent moeten een `MEDIA:<path-or-url>`-regel bevatten (op een eigen regel). Zie [OpenClaw-assistent instellen](/nl/start/openclaw) en [Agent verzenden](/nl/tools/agent-send).

    Verzenden via de CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Controleer ook:

    - Het doelkanaal ondersteunt uitgaande media en wordt niet geblokkeerd door allowlists.
    - Het bestand valt binnen de groottelimieten van de provider (afbeeldingen worden verkleind tot maximaal 2048px).
    - `tools.fs.workspaceOnly=true` beperkt verzendingen via lokale paden tot de workspace, temp/media-store en door de sandbox gevalideerde bestanden.
    - `tools.fs.workspaceOnly=false` laat `MEDIA:` host-lokale bestanden verzenden die de agent al kan lezen, maar alleen voor media plus veilige documenttypen (afbeeldingen, audio, video, PDF en Office-documenten). Platte tekst en bestanden die op geheimen lijken, worden nog steeds geblokkeerd.

    Zie [Afbeeldingen](/nl/nodes/images).

  </Accordion>
</AccordionGroup>

## Beveiliging en toegangscontrole

<AccordionGroup>
  <Accordion title="Is het veilig om OpenClaw bloot te stellen aan inkomende DM's?">
    Behandel inkomende DM's als niet-vertrouwde invoer. De standaardinstellingen zijn ontworpen om risico te beperken:

    - Standaardgedrag op kanalen met DM-ondersteuning is **koppelen**:
      - Onbekende afzenders ontvangen een koppelcode; de bot verwerkt hun bericht niet.
      - Keur goed met: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Openstaande verzoeken zijn beperkt tot **3 per kanaal**; controleer `openclaw pairing list --channel <channel> [--account <id>]` als er geen code is aangekomen.
    - DM's publiek openen vereist expliciete opt-in (`dmPolicy: "open"` en allowlist `"*"`).

    Voer `openclaw doctor` uit om riskant DM-beleid zichtbaar te maken.

  </Accordion>

  <Accordion title="Is promptinjectie alleen een zorg bij publieke bots?">
    Nee. Promptinjectie gaat over **niet-vertrouwde inhoud**, niet alleen over wie de bot een DM kan sturen.
    Als je assistent externe inhoud leest (webzoekopdracht/ophalen, browserpagina's, e-mails,
    docs, bijlagen, geplakte logs), kan die inhoud instructies bevatten die proberen
    het model over te nemen. Dit kan zelfs gebeuren als **jij de enige afzender bent**.

    Het grootste risico ontstaat wanneer tools zijn ingeschakeld: het model kan worden misleid om
    context te exfiltreren of namens jou tools aan te roepen. Beperk de impact door:

    - een alleen-lezen of tool-uitgeschakelde "reader"-agent te gebruiken om niet-vertrouwde inhoud samen te vatten
    - `web_search` / `web_fetch` / `browser` uit te houden voor agents met tools ingeschakeld
    - gedecodeerde bestands-/documenttekst ook als niet-vertrouwd te behandelen: OpenResponses
      `input_file` en extractie van mediabijlagen verpakken geëxtraheerde tekst beide in
      expliciete grensmarkeringen voor externe inhoud in plaats van ruwe bestandstekst door te geven
    - sandboxing en strikte tool-allowlists

    Details: [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Moet mijn bot een eigen e-mailadres, GitHub-account of telefoonnummer hebben?">
    Ja, voor de meeste opstellingen. De bot isoleren met aparte accounts en telefoonnummers
    verkleint de impact als er iets misgaat. Dit maakt het ook makkelijker om
    inloggegevens te roteren of toegang in te trekken zonder je persoonlijke accounts te beïnvloeden.

    Begin klein. Geef alleen toegang tot de tools en accounts die je echt nodig hebt, en breid
    later uit als dat nodig is.

    Docs: [Beveiliging](/nl/gateway/security), [Koppelen](/nl/channels/pairing).

  </Accordion>

  <Accordion title="Kan ik het autonomie geven over mijn sms'jes en is dat veilig?">
    We raden volledige autonomie over je persoonlijke berichten **niet** aan. Het veiligste patroon is:

    - Houd DM's in **koppelmodus** of een strakke allowlist.
    - Gebruik een **apart nummer of account** als je wilt dat het namens jou berichten verstuurt.
    - Laat het concepten maken en **keur goed vóór verzending**.

    Als je wilt experimenteren, doe dat dan op een speciaal account en houd het geïsoleerd. Zie
    [Beveiliging](/nl/gateway/security).

  </Accordion>

  <Accordion title="Kan ik goedkopere modellen gebruiken voor persoonlijke-assistenttaken?">
    Ja, **als** de agent alleen chat gebruikt en de invoer vertrouwd is. Kleinere tiers zijn
    gevoeliger voor instructie-overname, dus vermijd ze voor agents met tools ingeschakeld
    of bij het lezen van niet-vertrouwde inhoud. Als je een kleiner model moet gebruiken, vergrendel dan
    tools en draai binnen een sandbox. Zie [Beveiliging](/nl/gateway/security).
  </Accordion>

  <Accordion title="Ik heb /start uitgevoerd in Telegram maar kreeg geen koppelcode">
    Koppelcodes worden **alleen** verzonden wanneer een onbekende afzender de bot een bericht stuurt en
    `dmPolicy: "pairing"` is ingeschakeld. `/start` genereert op zichzelf geen code.

    Controleer openstaande verzoeken:

    ```bash
    openclaw pairing list telegram
    ```

    Als je direct toegang wilt, zet je afzender-id dan op de allowlist of stel `dmPolicy: "open"`
    in voor dat account.

  </Accordion>

  <Accordion title="WhatsApp: stuurt het berichten naar mijn contacten? Hoe werkt koppelen?">
    Nee. Het standaard DM-beleid voor WhatsApp is **koppelen**. Onbekende afzenders krijgen alleen een koppelcode en hun bericht wordt **niet verwerkt**. OpenClaw antwoordt alleen op chats die het ontvangt of op expliciete verzendingen die jij activeert.

    Keur koppelen goed met:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Toon openstaande verzoeken:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt voor telefoonnummer in de wizard: dit wordt gebruikt om je **allowlist/eigenaar** in te stellen zodat je eigen DM's zijn toegestaan. Het wordt niet gebruikt voor automatisch verzenden. Als je op je persoonlijke WhatsApp-nummer draait, gebruik dan dat nummer en schakel `channels.whatsapp.selfChatMode` in.

  </Accordion>
</AccordionGroup>

## Chatopdrachten, taken afbreken en "het stopt niet"

<AccordionGroup>
  <Accordion title="Hoe voorkom ik dat interne systeemberichten in de chat verschijnen?">
    De meeste interne of toolberichten verschijnen alleen wanneer **verbose**, **trace** of **reasoning** is ingeschakeld
    voor die sessie.

    Los dit op in de chat waarin je het ziet:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Als het nog steeds rumoerig is, controleer dan de sessie-instellingen in de Control UI en zet verbose
    op **inherit**. Controleer ook of je geen botprofiel gebruikt waarbij `verboseDefault` in de configuratie
    op `on` staat.

    Docs: [Denken en verbose](/nl/tools/thinking), [Beveiliging](/nl/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Hoe stop/annuleer ik een actieve taak?">
    Stuur een van deze **als zelfstandig bericht** (geen slash):

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

    De meeste opdrachten moeten worden verzonden als een **zelfstandig** bericht dat begint met `/`, maar enkele snelkoppelingen (zoals `/status`) werken ook inline voor afzenders op de allowlist.

  </Accordion>

  <Accordion title='Hoe stuur ik een Discord-bericht vanuit Telegram? ("Cross-context messaging denied")'>
    OpenClaw blokkeert standaard berichten tussen **providers**. Als een toolaanroep
    aan Telegram is gebonden, stuurt die niet naar Discord tenzij je dit expliciet toestaat.

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

    Herstart de gateway na het bewerken van de configuratie.

  </Accordion>

  <Accordion title='Waarom voelt het alsof de bot snel opeenvolgende berichten "negeert"?'>
    De wachtrijmodus bepaalt hoe nieuwe berichten omgaan met een lopende run. Gebruik `/queue` om modi te wijzigen:

    - `steer` - zet alle openstaande sturing in de wachtrij voor de volgende modelgrens in de huidige run
    - `queue` - verouderde sturing één voor één
    - `followup` - voer berichten één voor één uit
    - `collect` - groepeer berichten en antwoord één keer
    - `steer-backlog` - stuur nu, verwerk daarna de backlog
    - `interrupt` - breek de huidige run af en begin opnieuw

    De standaardmodus is `steer`. Je kunt opties toevoegen zoals `debounce:0.5s cap:25 drop:summarize` voor follow-upmodi. Zie [Opdrachtwachtrij](/nl/concepts/queue) en [Sturingswachtrij](/nl/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Diversen

<AccordionGroup>
  <Accordion title='Wat is het standaardmodel voor Anthropic met een API-sleutel?'>
    In OpenClaw staan referenties en modelselectie los van elkaar. Het instellen van `ANTHROPIC_API_KEY` (of het opslaan van een Anthropic API-sleutel in auth-profielen) schakelt authenticatie in, maar het daadwerkelijke standaardmodel is wat je configureert in `agents.defaults.model.primary` (bijvoorbeeld `anthropic/claude-sonnet-4-6` of `anthropic/claude-opus-4-6`). Als je `No credentials found for profile "anthropic:default"` ziet, betekent dit dat de Gateway geen Anthropic-referenties kon vinden in het verwachte `auth-profiles.json` voor de agent die wordt uitgevoerd.
  </Accordion>
</AccordionGroup>

---

Nog steeds vastgelopen? Vraag het in [Discord](https://discord.com/invite/clawd) of open een [GitHub-discussie](https://github.com/openclaw/openclaw/discussions).

## Gerelateerd

- [FAQ voor eerste gebruik](/nl/help/faq-first-run) — installeren, onboarden, authenticatie, abonnementen, vroege fouten
- [FAQ over modellen](/nl/help/faq-models) — modelselectie, failover, auth-profielen
- [Probleemoplossing](/nl/help/troubleshooting) — symptoomgerichte triage
