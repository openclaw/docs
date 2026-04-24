---
description: Real-world OpenClaw projects from the community
read_when:
    - Szukasz rzeczywistych przykładów użycia OpenClaw
    - Aktualizowanie wyróżnionych projektów społecznościowych
summary: Projekty i integracje stworzone przez społeczność, oparte na OpenClaw
title: Prezentacja
x-i18n:
    generated_at: "2026-04-24T09:33:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

Projekty OpenClaw nie są pokazowymi zabawkami. Ludzie wdrażają pętle przeglądu PR, aplikacje mobilne, automatykę domową, systemy głosowe, devtools i przepływy pracy intensywnie wykorzystujące pamięć z kanałów, których już używają — natywne dla czatu środowiska budowania na Telegramie, WhatsApp, Discordzie i w terminalach; rzeczywistą automatyzację rezerwacji, zakupów i wsparcia bez czekania na API; oraz integracje ze światem fizycznym z drukarkami, odkurzaczami, kamerami i systemami domowymi.

<Info>
**Chcesz zostać wyróżniony?** Udostępnij swój projekt w [#self-promotion na Discordzie](https://discord.gg/clawd) lub [oznacz @openclaw na X](https://x.com/openclaw).
</Info>

## Wideo

Zacznij tutaj, jeśli chcesz najszybciej przejść od „co to jest?” do „okej, rozumiem”.

<CardGroup cols={3}>

<Card title="Pełny przewodnik konfiguracji" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 minut. Instalacja, wdrożenie i uruchomienie pierwszego działającego asystenta od początku do końca.
</Card>

<Card title="Przegląd projektów społeczności" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Szybszy przegląd rzeczywistych projektów, interfejsów i przepływów pracy zbudowanych wokół OpenClaw.
</Card>

<Card title="Projekty w praktyce" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Przykłady ze społeczności — od natywnych dla czatu pętli programistycznych po sprzęt i osobistą automatyzację.
</Card>

</CardGroup>

## Świeżo z Discorda

Najnowsze wyróżniające się przykłady z obszarów programowania, devtools, mobile i tworzenia produktów natywnych dla czatu.

<CardGroup cols={2}>

<Card title="Przegląd PR i informacje zwrotne na Telegramie" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode kończy zmianę, otwiera PR, a OpenClaw przegląda diff i odpowiada na Telegramie sugestiami oraz jasnym werdyktem, czy scalać.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Informacje zwrotne z przeglądu PR OpenClaw dostarczone na Telegramie" />
</Card>

<Card title="Skill piwniczki z winem w kilka minut" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Poproszono „Robby’ego” (@openclaw) o lokalny Skill do piwniczki z winem. Prosi o przykładowy eksport CSV i ścieżkę zapisu, a następnie buduje i testuje Skill (962 butelki w przykładzie).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw budujący lokalny Skill do piwniczki z winem z pliku CSV" />
</Card>

<Card title="Autopilot zakupów Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Tygodniowy plan posiłków, stałe produkty, rezerwacja terminu dostawy, potwierdzenie zamówienia. Bez API, tylko sterowanie przeglądarką.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatyzacja zakupów Tesco przez czat" />
</Card>

<Card title="SNAG: zrzut ekranu do Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Skrót klawiszowy do wybrania obszaru ekranu, Gemini vision, natychmiastowy Markdown w schowku.

  <img src="/assets/showcase/snag.png" alt="Narzędzie SNAG do konwersji zrzutów ekranu na Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplikacja desktopowa do zarządzania Skills i poleceniami w Agents, Claude, Codex i OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplikacja Agents UI" />
</Card>

<Card title="Notatki głosowe na Telegramie (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Społeczność** • `voice` `tts` `telegram`

Opakowuje papla.media TTS i wysyła wyniki jako notatki głosowe na Telegramie (bez irytującego autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Wynik TTS jako notatka głosowa na Telegramie" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Pomocnicze narzędzie instalowane przez Homebrew do wyświetlania, inspekcji i obserwowania lokalnych sesji OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor w ClawHub" />
</Card>

<Card title="Sterowanie drukarką 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Sterowanie i diagnozowanie drukarek BambuLab: status, zadania, kamera, AMS, kalibracja i nie tylko.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI w ClawHub" />
</Card>

<Card title="Transport w Wiedniu (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Odjazdy w czasie rzeczywistym, utrudnienia, status wind i wyznaczanie tras dla transportu publicznego w Wiedniu.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien w ClawHub" />
</Card>

<Card title="Posiłki szkolne ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Zautomatyzowana rezerwacja posiłków szkolnych w Wielkiej Brytanii przez ParentPay. Używa współrzędnych myszy do niezawodnego klikania komórek tabeli.
</Card>

<Card title="Przesyłanie do R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Przesyłanie do Cloudflare R2/S3 i generowanie bezpiecznych, presigned linków do pobierania. Przydatne dla zdalnych instancji OpenClaw.
</Card>

<Card title="Aplikacja iOS przez Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Kompletna aplikacja iOS z mapami i nagrywaniem głosu, wdrożona do TestFlight całkowicie przez czat na Telegramie.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Aplikacja iOS w TestFlight" />
</Card>

<Card title="Asystent zdrowia Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Osobisty asystent zdrowotny AI integrujący dane z Oura Ring z kalendarzem, spotkaniami i harmonogramem siłowni.

  <img src="/assets/showcase/oura-health.png" alt="Asystent zdrowia Oura Ring" />
</Card>

<Card title="Dream Team Keva (ponad 14 agentów)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Ponad 14 agentów pod jednym gatewayem z orkiestratorem Opus 4.5 delegującym zadania do workerów Codex. Zobacz [opis techniczny](https://github.com/adam91holt/orchestrated-ai-articles) i [Clawdspace](https://github.com/adam91holt/clawdspace) do sandboxowania agentów.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI do Linear z integracją z agentowymi przepływami pracy (Claude Code, OpenClaw). Zarządzaj zgłoszeniami, projektami i przepływami pracy z terminala.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Odczytywanie, wysyłanie i archiwizowanie wiadomości przez Beeper Desktop. Używa lokalnego API MCP Beepera, dzięki czemu agenci mogą zarządzać wszystkimi Twoimi czatami (iMessage, WhatsApp i inne) w jednym miejscu.
</Card>

</CardGroup>

## Automatyzacja i przepływy pracy

Harmonogramy, sterowanie przeglądarką, pętle wsparcia i ta strona produktu, która mówi „po prostu wykonaj to zadanie za mnie”.

<CardGroup cols={2}>

<Card title="Sterowanie oczyszczaczem powietrza Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code wykrył i potwierdził sterowanie oczyszczaczem, a następnie OpenClaw przejął zarządzanie jakością powietrza w pomieszczeniu.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Sterowanie oczyszczaczem powietrza Winix przez OpenClaw" />
</Card>

<Card title="Ładne zdjęcia nieba z kamery" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Wyzwalane przez kamerę na dachu: poproś OpenClaw o zrobienie zdjęcia nieba, gdy wygląda wyjątkowo ładnie. Zaprojektował Skill i zrobił zdjęcie.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Zdjęcie nieba z kamery dachowej wykonane przez OpenClaw" />
</Card>

<Card title="Wizualna poranna scena informacyjna" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Zaplanowany prompt generuje każdego ranka jeden obraz sceny (pogoda, zadania, data, ulubiony post lub cytat) za pomocą persony OpenClaw.
</Card>

<Card title="Rezerwacja kortu do padla" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Narzędzie do sprawdzania dostępności w Playtomic i CLI do rezerwacji. Nigdy więcej nie przegapisz wolnego kortu.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Zrzut ekranu padel-cli" />
</Card>

<Card title="Obsługa księgowości" icon="file-invoice-dollar">
  **Społeczność** • `automation` `email` `pdf`

Zbiera pliki PDF z poczty e-mail i przygotowuje dokumenty dla doradcy podatkowego. Miesięczna księgowość na autopilocie.
</Card>

<Card title="Programowanie z kanapy" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Przebudował całą osobistą stronę przez Telegram podczas oglądania Netfliksa — migracja z Notion do Astro, 18 wpisów przeniesionych, DNS do Cloudflare. Ani razu nie otworzył laptopa.
</Card>

<Card title="Agent do szukania pracy" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Wyszukuje oferty pracy, dopasowuje je do słów kluczowych z CV i zwraca odpowiednie okazje z linkami. Zbudowany w 30 minut przy użyciu API JSearch.
</Card>

<Card title="Generator Skills do Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw połączył się z Jira, a następnie wygenerował nowy Skill w locie (zanim pojawił się w ClawHub).
</Card>

<Card title="Skill do Todoist przez Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Zautomatyzował zadania Todoist i kazał OpenClaw wygenerować Skill bezpośrednio na czacie Telegram.
</Card>

<Card title="Analiza TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Loguje się do TradingView przez automatyzację przeglądarki, robi zrzuty wykresów i wykonuje analizę techniczną na żądanie. Bez API — tylko sterowanie przeglądarką.
</Card>

<Card title="Automatyczne wsparcie na Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitoruje firmowy kanał Slack, udziela pomocnych odpowiedzi i przekazuje powiadomienia do Telegrama. Samodzielnie naprawił błąd produkcyjny we wdrożonej aplikacji bez żadnej prośby.
</Card>

</CardGroup>

## Wiedza i pamięć

Systemy, które indeksują, przeszukują, zapamiętują i rozumują na podstawie wiedzy osobistej lub zespołowej.

<CardGroup cols={2}>

<Card title="xuezh — nauka chińskiego" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Silnik do nauki chińskiego z informacją zwrotną o wymowie i przepływami nauki przez OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Informacja zwrotna o wymowie w xuezh" />
</Card>

<Card title="Skarbiec pamięci WhatsApp" icon="vault">
  **Społeczność** • `memory` `transcription` `indexing`

Importuje pełne eksporty WhatsApp, transkrybuje ponad 1 tys. notatek głosowych, porównuje z logami git i generuje powiązane raporty w Markdown.
</Card>

<Card title="Wyszukiwanie semantyczne Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Dodaje wyszukiwanie wektorowe do zakładek Karakeep przy użyciu Qdrant oraz embeddingów OpenAI lub Ollama.
</Card>

<Card title="Pamięć Inside-Out-2" icon="brain">
  **Społeczność** • `memory` `beliefs` `self-model`

Oddzielny menedżer pamięci, który zamienia pliki sesji w wspomnienia, potem w przekonania, a następnie w ewoluujący model siebie.
</Card>

</CardGroup>

## Głos i telefon

Punkty wejścia oparte na mowie, mosty telefoniczne i przepływy pracy intensywnie wykorzystujące transkrypcję.

<CardGroup cols={2}>

<Card title="Most telefoniczny Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Most HTTP między asystentem głosowym Vapi a OpenClaw. Połączenia telefoniczne z Twoim agentem niemal w czasie rzeczywistym.
</Card>

<Card title="Transkrypcja OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Wielojęzyczna transkrypcja audio przez OpenRouter (Gemini i inne). Dostępne w ClawHub.
</Card>

</CardGroup>

## Infrastruktura i wdrażanie

Pakowanie, wdrażanie i integracje, które ułatwiają uruchamianie i rozszerzanie OpenClaw.

<CardGroup cols={2}>

<Card title="Dodatek Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw działający w Home Assistant OS z obsługą tunelu SSH i trwałym stanem.
</Card>

<Card title="Skill do Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Steruj urządzeniami Home Assistant i automatyzuj je za pomocą języka naturalnego.
</Card>

<Card title="Pakowanie Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Kompletna, oparta na Nix konfiguracja OpenClaw do powtarzalnych wdrożeń.
</Card>

<Card title="Kalendarz CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill kalendarza używający khal i vdirsyncer. Samodzielnie hostowana integracja kalendarza.
</Card>

</CardGroup>

## Dom i sprzęt

Fizyczny wymiar OpenClaw: domy, czujniki, kamery, odkurzacze i inne urządzenia.

<CardGroup cols={2}>

<Card title="Automatyzacja GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automatyzacja domu natywna dla Nix z OpenClaw jako interfejsem oraz pulpitami Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Pulpit Grafana GoHome" />
</Card>

<Card title="Odkurzacz Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Steruj swoim robotem sprzątającym Roborock za pomocą naturalnej rozmowy.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status Roborock" />
</Card>

</CardGroup>

## Projekty społeczności

Rzeczy, które wyrosły poza pojedynczy przepływ pracy i stały się szerszymi produktami lub ekosystemami.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Społeczność** • `marketplace` `astronomy` `webapp`

Kompletny marketplace sprzętu astronomicznego. Zbudowany z użyciem ekosystemu OpenClaw i wokół niego.
</Card>

</CardGroup>

## Prześlij swój projekt

<Steps>
  <Step title="Udostępnij go">
    Opublikuj go w [#self-promotion na Discordzie](https://discord.gg/clawd) lub [napisz post i oznacz @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Dołącz szczegóły">
    Opowiedz, co robi, podaj link do repozytorium lub dema i dołącz zrzut ekranu, jeśli go masz.
  </Step>
  <Step title="Zostań wyróżniony">
    Dodamy wyróżniające się projekty do tej strony.
  </Step>
</Steps>

## Powiązane

- [Pierwsze kroki](/pl/start/getting-started)
- [OpenClaw](/pl/start/openclaw)
