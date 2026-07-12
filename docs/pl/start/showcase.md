---
description: Real-world OpenClaw projects from the community
read_when:
    - Szukasz rzeczywistych przykładów użycia OpenClaw
    - Aktualizowanie wyróżnionych projektów społecznościowych
summary: Projekty i integracje tworzone przez społeczność i oparte na OpenClaw
title: Prezentacja
x-i18n:
    generated_at: "2026-07-12T15:42:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Projekty OpenClaw tworzone przez społeczność: procesy przeglądu PR-ów, aplikacje mobilne, automatyka domowa, systemy głosowe, narzędzia programistyczne i przepływy pracy związane z pamięcią, zaprojektowane z myślą o obsłudze przez czat w Telegramie, WhatsAppie, Discordzie i terminalach.

<Info>
**Chcesz znaleźć się na tej liście?** Udostępnij swój projekt na kanale [#self-promotion w Discordzie](https://discord.gg/clawd) lub [oznacz @openclaw na X](https://x.com/openclaw).
</Info>

## Najnowsze z Discorda

Najnowsze wyróżniające się projekty z obszarów programowania, narzędzi programistycznych, aplikacji mobilnych i tworzenia produktów opartych na czacie.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Powiedz agentowi „wdróż ten kod HTML”, a po mniej więcej sekundzie otrzymasz publiczny adres URL. Strony automatycznie wygasają po godzinie — bez serwera, konfiguracji i rejestracji.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Wklej dowolny adres URL i otrzymaj ocenę. Ponad 2,5 mln domen oszustów z 38 źródeł (PhishTank, OpenPhish, CERT.PL i innych) jest sprawdzanych lokalnie, dzięki czemu historia przeglądania nigdy nie opuszcza urządzenia.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Zestaw trzech Skills do pracy nad produktem: [Dialog sokratejski](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) szczegółowo analizuje pytanie przed udzieleniem odpowiedzi, [Strateg modelu Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) klasyfikuje funkcje według tego, czy zasługują na swoje miejsce, a [Czytelne wyniki agenta](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) przepisują wyniki agenta prostym językiem.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Zapobiega bezczynności koordynatorów podczas pracy podagentów: to mechanizm asynchronicznych wywołań zwrotnych, w którym wyniki trafiają do skrzynki odbiorczej zamiast blokować agenta nadrzędnego.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Pozwala wygodnie korzystać z OpenClaw na urządzeniach z 2–4 GB pamięci RAM: sprawdza dostępną pamięć i ogranicza zasobożerne funkcje, zanim system zacznie intensywnie korzystać z przestrzeni wymiany. [Kod źródłowy w GitHubie](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Monitor kosztów tokenów stworzony przez inżyniera NVIDIA, z pełnoprawną obsługą OpenClaw: pokazuje dokładnie, na co przeznaczane są środki agenta, z podziałem na modele i sesje.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Opisz diagram na czacie i otrzymaj programowo wygenerowany szkic Excalidraw.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw zbudował własne narzędzie do wykonywania zapytań Google Analytics, a następnie spakował je i opublikował w ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Porównuje modele w 59 rolach agentów, aby odpowiedzieć na pytanie „który LLM wybrać do mojego GPU?”. Popularne w społeczności narzędzie do wybierania modeli lokalnych.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Generowanie utworów niezależne od dostawcy: zaplanuj utwór, określ strukturę tekstu i poprawiaj niepełne wyniki zamiast polegać na pojedynczym poleceniu. Obejmuje [wariant MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) z kontrolą tempa BPM, tonacji, struktury i łączenia utworów.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode kończy wprowadzanie zmian i otwiera PR, a OpenClaw przegląda różnice oraz odpowiada w Telegramie, przekazując sugestie i jednoznaczną ocenę możliwości scalenia.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Poproszono „Robby’ego” (@openclaw) o lokalny Skill do zarządzania piwniczką z winami. Prosi on o przykładowy eksport CSV i ścieżkę przechowywania, a następnie tworzy i testuje Skill (w przykładzie obejmujący 962 butelki).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Cotygodniowy jadłospis, regularnie kupowane produkty, rezerwacja terminu dostawy i potwierdzenie zamówienia. Bez interfejsów API — wyłącznie sterowanie przeglądarką.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Zaznacz skrótem klawiszowym obszar ekranu, użyj analizy obrazu Gemini i natychmiast otrzymaj Markdown w schowku.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplikacja komputerowa do zarządzania Skills i poleceniami w środowiskach Agents, Claude, Codex i OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Społeczność** • `voice` `tts` `telegram`

Integruje syntezę mowy papla.media i wysyła wyniki jako wiadomości głosowe w Telegramie (bez irytującego automatycznego odtwarzania).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Narzędzie pomocnicze instalowane przez Homebrew, służące do wyświetlania, sprawdzania i monitorowania lokalnych sesji OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Sterowanie drukarkami BambuLab i rozwiązywanie problemów: stan, zadania, kamera, AMS, kalibracja i inne funkcje.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Odjazdy w czasie rzeczywistym, utrudnienia, stan wind i wyznaczanie tras w wiedeńskim transporcie publicznym.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automatyczna rezerwacja posiłków w brytyjskiej szkole za pośrednictwem ParentPay. Wykorzystuje współrzędne myszy do niezawodnego klikania komórek tabeli.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Przesyłanie plików do Cloudflare R2/S3 i generowanie bezpiecznych, wstępnie podpisanych odnośników do pobierania. Przydatne w przypadku zdalnych instancji OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Kompletna aplikacja na iOS z mapami i nagrywaniem głosu, przygotowana do dystrybucji w App Store wyłącznie za pośrednictwem czatu w Telegramie.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Osobisty asystent zdrowotny AI integrujący dane z pierścienia Oura z kalendarzem, wizytami i harmonogramem treningów.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Ponad 14 agentów działających za jednym Gateway, z koordynatorem Opus 4.5 delegującym zadania agentom roboczym Codex. Zapoznaj się z [opisem technicznym](https://github.com/adam91holt/orchestrated-ai-articles) oraz projektem [Clawdspace](https://github.com/adam91holt/clawdspace), który zapewnia izolację agentów.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI dla Linear, które integruje się z przepływami pracy opartymi na agentach (Claude Code, OpenClaw). Zarządzaj zgłoszeniami, projektami i przepływami pracy z poziomu terminala.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Odczytywanie, wysyłanie i archiwizowanie wiadomości za pośrednictwem Beeper Desktop. Wykorzystuje lokalny interfejs MCP API aplikacji Beeper, dzięki czemu agenci mogą zarządzać wszystkimi czatami (iMessage, WhatsApp i innymi) w jednym miejscu.
</Card>

</CardGroup>

## Automatyzacja i przepływy pracy

Planowanie, sterowanie przeglądarką, procesy obsługi oraz ta część produktu, która „po prostu wykonuje zadanie za mnie”.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code wykrył i potwierdził elementy sterowania oczyszczaczem, a następnie OpenClaw przejął zarządzanie jakością powietrza w pomieszczeniu.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Uruchamiane przez kamerę dachową: poproś OpenClaw o zrobienie zdjęcia nieba, gdy tylko wygląda ono pięknie. OpenClaw zaprojektował Skill i wykonał zdjęcie.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Zaplanowane polecenie generuje każdego ranka jeden obraz sceny (pogoda, zadania, data, ulubiony wpis lub cytat) za pomocą persony OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Narzędzie sprawdzające dostępność w Playtomic wraz z CLI do rezerwowania. Dzięki niemu już nigdy nie przegapisz wolnego kortu.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Społeczność** • `automation` `email` `pdf`

Zbiera pliki PDF z wiadomości e-mail i przygotowuje dokumenty dla doradcy podatkowego. Comiesięczna księgowość na autopilocie.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Przebudowano całą osobistą witrynę przez Telegram podczas oglądania Netflixa — migracja z Notion do Astro, przeniesienie 18 wpisów i skierowanie DNS do Cloudflare. Bez otwierania laptopa.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Przeszukuje oferty pracy, porównuje je ze słowami kluczowymi w CV i zwraca odpowiednie propozycje wraz z odnośnikami. Zbudowany w 30 minut przy użyciu interfejsu JSearch API.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw połączył się z Jira, a następnie na bieżąco wygenerował nową umiejętność (zanim pojawiła się ona w ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Zautomatyzowano zadania Todoist, a OpenClaw wygenerował umiejętność bezpośrednio na czacie Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Loguje się do TradingView za pomocą automatyzacji przeglądarki, wykonuje zrzuty ekranu wykresów i przeprowadza analizę techniczną na żądanie. Nie wymaga API — wystarczy sterowanie przeglądarką.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClaw otrzymał swobodę działania w kontaktach ze sprzedawcami samochodów: prowadził negocjacje w obie strony i obniżył cenę o 4200 USD.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Znajduje w poczcie najbliższy lot, przeprowadza odprawę online i wybiera miejsce przy oknie — bez potrzeby korzystania z aplikacji linii lotniczej.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Samodzielnie zgłosił roszczenie ubezpieczeniowe i umówił wizytę kontrolną.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI API Idealista do wyszukiwania i wyceny nieruchomości, opakowane jako umiejętność, dzięki której agent może szukać domu na czacie.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Monitoruje Gmail pod kątem zleceń, analizuje zdjęcia nieruchomości przesłane przez Telegram, tworzy wielostronicowe kosztorysy w formacie PDF za pomocą LaTeX i wystawia faktury przez Xero.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitoruje firmowy kanał Slack, udziela pomocnych odpowiedzi i przekazuje powiadomienia do Telegram. Samodzielnie naprawił błąd produkcyjny we wdrożonej aplikacji, mimo że nikt go o to nie poprosił.
</Card>

</CardGroup>

## Wiedza i pamięć

Systemy, które indeksują, przeszukują i zapamiętują wiedzę osobistą lub zespołową oraz wnioskują na jej podstawie.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Mechanizm nauki języka chińskiego z informacjami zwrotnymi dotyczącymi wymowy i procesami nauki obsługiwanymi przez OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Pobrano 4 miliony postów ze 100 najpopularniejszych kont na X i przekształcono je w potok analityczny umożliwiający wykonywanie zapytań.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Uporządkowano wyniki wieloletnich badań krwi w ustrukturyzowanej bazie danych Notion.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Asystent do codziennego użytku w WhatsApp, którego cała pamięć jest przechowywana jako pliki Markdown w wersjonowanym repozytorium Obsidian: monitorowanie kalorii i treningów, listy zadań oraz zarządzanie codziennymi sprawami.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Działa na rodzinnym czacie grupowym Telegram, dokumentuje historie ponad 50 krewnych i zadaje trafne pytania uzupełniające — osobom, dla których nepalski jest językiem ojczystym, odpowiada po nepalsku.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Społeczność** • `memory` `transcription` `indexing`

Importuje pełne eksporty z WhatsApp, transkrybuje ponad tysiąc wiadomości głosowych, porównuje je z dziennikami git i generuje połączone raporty w formacie Markdown.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Dodaje wyszukiwanie wektorowe do zakładek Karakeep przy użyciu Qdrant oraz reprezentacji wektorowych OpenAI lub Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Społeczność** • `memory` `beliefs` `self-model`

Oddzielny menedżer pamięci, który przekształca pliki sesji w wspomnienia, następnie w przekonania, a później w ewoluujący model samego siebie.
</Card>

</CardGroup>

## Głos i telefon

Punkty dostępu oparte przede wszystkim na mowie, mosty telefoniczne i procesy intensywnie wykorzystujące transkrypcję.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Jedno dotknięcie Pebble Ring rozpoczyna rozmowę głosową z OpenClaw — zapewniając dostęp do agenta z urządzenia ubieralnego.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Pełne studio multimedialne na czacie: synteza mowy, transkrypcja i automatyzacja przeglądarki połączone z Codex 5.2 oraz MiniMax.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Przycisk czynności iPhone'a połączony z OpenClaw: naciśnij, mów, a agent odpowie głosowo jak przez krótkofalówkę.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Most HTTP łączący asystenta głosowego Vapi z OpenClaw. Rozmowy telefoniczne z agentem niemal w czasie rzeczywistym.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Wielojęzyczna transkrypcja dźwięku przez OpenRouter (Gemini i inne modele). Dostępna w ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Infrastruktura i wdrażanie

Pakowanie, wdrażanie i integracje ułatwiające uruchamianie oraz rozszerzanie OpenClaw.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw działający w Home Assistant OS, z obsługą tunelu SSH i trwałego stanu.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Sterowanie urządzeniami Home Assistant i ich automatyzacja za pomocą języka naturalnego.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Natywna aplikacja Swift na pasku menu, wyświetlająca stan agenta i udostępniająca szybkie elementy sterujące.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Kompletna konfiguracja OpenClaw dostosowana do Nix, umożliwiająca powtarzalne wdrożenia.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Umiejętność obsługi kalendarza wykorzystująca khal i vdirsyncer. Integracja z samodzielnie hostowanym kalendarzem.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Dom i sprzęt

Fizyczny wymiar OpenClaw: domy, czujniki, kamery, odkurzacze i inne urządzenia.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw znalazł urządzenia HomePod w sieci lokalnej i sam napisał umiejętność do sterowania nimi.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Tania holograficzna kostka pełniąca funkcję fizycznej twarzy agenta na biurku.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Natywna dla Nix automatyka domowa z OpenClaw jako interfejsem oraz pulpitami Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Sterowanie robotem sprzątającym Roborock za pomocą swobodnej rozmowy.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Projekty społeczności

Rozwiązania, które wykroczyły poza pojedynczy proces i rozwinęły się w szersze produkty lub ekosystemy.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Społeczność** • `marketplace` `astronomy` `webapp`

Kompletny rynek sprzętu astronomicznego. Zbudowany przy użyciu ekosystemu OpenClaw i wokół niego.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Otwarty protokół negocjacji między agentami: Twój agent negocjuje oferty, terminy i umowy o świadczenie usług z innymi węzłami oraz podpisuje kryptograficznie wynik — Ty jedynie go zatwierdzasz lub odrzucasz.
</Card>

</CardGroup>

## Zgłoś swój projekt

<Steps>
  <Step title="Share it">
    Opublikuj go na [kanale #self-promotion w Discord](https://discord.gg/clawd) lub [oznacz @openclaw w poście na X](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Opisz, co robi, dodaj odnośnik do repozytorium lub wersji demonstracyjnej i udostępnij zrzut ekranu, jeśli go masz.
  </Step>
  <Step title="Get featured">
    Dodamy wyróżniające się projekty do tej strony.
  </Step>
</Steps>

## Powiązane materiały

- [Pierwsze kroki](/pl/start/getting-started)
- [OpenClaw](/pl/start/openclaw)
- [Pełna prezentacja projektów z X w witrynie openclaw.ai](https://openclaw.ai/showcase/)
