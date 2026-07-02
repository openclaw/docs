---
description: Real-world OpenClaw projects from the community
read_when:
    - Wyszukiwanie rzeczywistych przykładów użycia OpenClaw
    - Aktualizowanie wyróżnionych projektów społeczności
summary: Projekty i integracje tworzone przez społeczność, oparte na OpenClaw
title: Prezentacja
x-i18n:
    generated_at: "2026-07-02T08:57:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

Projekty OpenClaw nie są zabawkowymi demami. Ludzie uruchamiają pętle przeglądu PR, aplikacje mobilne, automatykę domową, systemy głosowe, narzędzia deweloperskie i przepływy pracy intensywnie korzystające z pamięci z kanałów, których już używają — kompilacje natywne dla czatu w Telegram, WhatsApp, Discord i terminalach; prawdziwą automatyzację rezerwacji, zakupów i wsparcia bez czekania na API; oraz integracje ze światem fizycznym, takie jak drukarki, odkurzacze, kamery i systemy domowe.

<Info>
**Chcesz zostać wyróżniony?** Udostępnij swój projekt na [#self-promotion na Discord](https://discord.gg/clawd) albo [oznacz @openclaw na X](https://x.com/openclaw).
</Info>

## Świeżo z Discord

Ostatnie wyróżniające się projekty z obszarów kodowania, narzędzi deweloperskich, urządzeń mobilnych i tworzenia produktów natywnych dla czatu.

<CardGroup cols={2}>

<Card title="Przegląd PR do informacji zwrotnej w Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode kończy zmianę, otwiera PR, OpenClaw przegląda różnicę i odpowiada w Telegram sugestiami oraz jasnym werdyktem dotyczącym scalenia.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Informacja zwrotna z przeglądu PR OpenClaw dostarczona w Telegram" />
</Card>

<Card title="Skill piwniczki win w kilka minut" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Poproszono „Robby'ego” (@openclaw) o lokalny Skill piwniczki win. Prosi o przykładowy eksport CSV i ścieżkę magazynu, a następnie buduje i testuje Skill (962 butelki w przykładzie).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw budujący lokalny Skill piwniczki win z CSV" />
</Card>

<Card title="Autopilot zakupów Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Tygodniowy plan posiłków, stałe produkty, rezerwacja terminu dostawy, potwierdzenie zamówienia. Bez API, tylko sterowanie przeglądarką.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatyzacja zakupów Tesco przez czat" />
</Card>

<Card title="SNAG: zrzut ekranu do Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Skrót klawiszowy dla obszaru ekranu, wizja Gemini, natychmiastowy Markdown w schowku.

  <img src="/assets/showcase/snag.png" alt="Narzędzie SNAG do konwersji zrzutu ekranu na Markdown" />
</Card>

<Card title="Interfejs Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplikacja desktopowa do zarządzania Skills i poleceniami w Agents, Claude, Codex i OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplikacja Agents UI" />
</Card>

<Card title="Notatki głosowe Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Opakowuje TTS papla.media i wysyła wyniki jako notatki głosowe Telegram (bez irytującego autoodtwarzania).

  <img src="/assets/showcase/papla-tts.jpg" alt="Wynik TTS jako notatka głosowa Telegram" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Pomocnik instalowany przez Homebrew do listowania, inspekcji i obserwowania lokalnych sesji OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor w ClawHub" />
</Card>

<Card title="Sterowanie drukarką 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Sterowanie i rozwiązywanie problemów z drukarkami BambuLab: status, zadania, kamera, AMS, kalibracja i więcej.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI w ClawHub" />
</Card>

<Card title="Transport w Wiedniu (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Odjazdy w czasie rzeczywistym, zakłócenia, status wind i wyznaczanie tras dla transportu publicznego w Wiedniu.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien w ClawHub" />
</Card>

<Card title="Szkolne posiłki ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Zautomatyzowana rezerwacja szkolnych posiłków w Wielkiej Brytanii przez ParentPay. Używa współrzędnych myszy do niezawodnego klikania komórek tabeli.
</Card>

<Card title="Przesyłanie R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Przesyłanie do Cloudflare R2/S3 i generowanie bezpiecznych wstępnie podpisanych linków do pobierania. Przydatne dla zdalnych instancji OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill przesyłania R2 w ClawHub" />
</Card>

<Card title="Aplikacja iOS przez Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Zbudowano kompletną aplikację iOS z mapami i nagrywaniem głosu, przygotowaną do dystrybucji w App Store w całości przez czat Telegram.
</Card>

<Card title="Asystent zdrowia Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Osobisty asystent zdrowia AI integrujący dane z Oura Ring z kalendarzem, wizytami i harmonogramem siłowni.

  <img src="/assets/showcase/oura-health.png" alt="Asystent zdrowia Oura Ring" />
</Card>

<Card title="Dream Team Keva (14+ agentów)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Ponad 14 agentów pod jednym Gateway z orkiestratorem Opus 4.5 delegującym zadania do pracowników Codex. Zobacz [opis techniczny](https://github.com/adam91holt/orchestrated-ai-articles) i [Clawdspace](https://github.com/adam91holt/clawdspace) dotyczące izolacji agentów.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI dla Linear, który integruje się z przepływami agentowymi (Claude Code, OpenClaw). Zarządzaj zgłoszeniami, projektami i przepływami pracy z terminala.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Odczytuj, wysyłaj i archiwizuj wiadomości przez Beeper Desktop. Używa lokalnego API MCP Beeper, aby agenci mogli zarządzać wszystkimi Twoimi czatami (iMessage, WhatsApp i innymi) w jednym miejscu.
</Card>

</CardGroup>

## Automatyzacja i przepływy pracy

Planowanie, sterowanie przeglądarką, pętle wsparcia i strona produktu typu „po prostu wykonaj za mnie zadanie”.

<CardGroup cols={2}>

<Card title="Sterowanie oczyszczaczem powietrza Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code wykrył i potwierdził elementy sterowania oczyszczaczem, a następnie OpenClaw przejmuje zarządzanie jakością powietrza w pomieszczeniu.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Sterowanie oczyszczaczem powietrza Winix przez OpenClaw" />
</Card>

<Card title="Ładne ujęcia nieba z kamery" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Wyzwalane przez kamerę dachową: poproś OpenClaw o zrobienie zdjęcia nieba, gdy wygląda ładnie. Zaprojektował Skill i zrobił zdjęcie.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Zrzut nieba z kamery dachowej wykonany przez OpenClaw" />
</Card>

<Card title="Wizualna poranna odprawa" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Zaplanowany prompt generuje co rano jeden obraz sceny (pogoda, zadania, data, ulubiony post lub cytat) przez personę OpenClaw.
</Card>

<Card title="Rezerwacja kortu do padla" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Sprawdzanie dostępności Playtomic oraz CLI do rezerwacji. Nigdy więcej nie przegap wolnego kortu.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Zrzut ekranu padel-cli" />
</Card>

<Card title="Przyjmowanie dokumentów księgowych" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Zbiera pliki PDF z e-maili i przygotowuje dokumenty dla doradcy podatkowego. Miesięczna księgowość na autopilocie.
</Card>

<Card title="Tryb deweloperski z kanapy" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Przebudowano całą osobistą stronę przez Telegram podczas oglądania Netflixa — z Notion do Astro, 18 postów zmigrowanych, DNS do Cloudflare. Laptop nie został ani razu otwarty.
</Card>

<Card title="Agent szukania pracy" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Przeszukuje oferty pracy, dopasowuje je do słów kluczowych z CV i zwraca odpowiednie możliwości z linkami. Zbudowany w 30 minut przy użyciu API JSearch.
</Card>

<Card title="Kreator Skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw połączył się z Jira, a następnie wygenerował nowy Skill w locie (zanim istniał w ClawHub).
</Card>

<Card title="Skill Todoist przez Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Zautomatyzowano zadania Todoist, a OpenClaw wygenerował Skill bezpośrednio w czacie Telegram.
</Card>

<Card title="Analiza TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Loguje się do TradingView przez automatyzację przeglądarki, robi zrzuty ekranów wykresów i wykonuje analizę techniczną na żądanie. API nie jest potrzebne — wystarczy sterowanie przeglądarką.
</Card>

<Card title="Automatyczne wsparcie Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Obserwuje firmowy kanał Slack, odpowiada pomocnie i przekazuje powiadomienia do Telegram. Autonomicznie naprawił błąd produkcyjny we wdrożonej aplikacji bez proszenia.
</Card>

</CardGroup>

## Wiedza i pamięć

Systemy, które indeksują, wyszukują, zapamiętują i rozumują na podstawie wiedzy osobistej lub zespołowej.

<CardGroup cols={2}>

<Card title="Nauka chińskiego xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Silnik do nauki chińskiego z informacją zwrotną o wymowie i przepływami nauki przez OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Informacja zwrotna o wymowie xuezh" />
</Card>

<Card title="Skarbiec pamięci WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Przetwarza pełne eksporty WhatsApp, transkrybuje ponad 1 tys. notatek głosowych, porównuje z logami git i generuje połączone raporty markdown.
</Card>

<Card title="Wyszukiwanie semantyczne Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Dodaje wyszukiwanie wektorowe do zakładek Karakeep przy użyciu Qdrant oraz osadzeń OpenAI lub Ollama.
</Card>

<Card title="Pamięć Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Oddzielny menedżer pamięci, który zamienia pliki sesji w wspomnienia, następnie przekonania, a potem w ewoluujący model własny.
</Card>

</CardGroup>

## Głos i telefon

Punkty wejścia oparte przede wszystkim na mowie, mosty telefoniczne i przepływy pracy intensywnie korzystające z transkrypcji.

<CardGroup cols={2}>

<Card title="Most telefoniczny Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Asystent głosowy Vapi do mostu HTTP OpenClaw. Rozmowy telefoniczne z agentem w niemal czasie rzeczywistym.
</Card>

<Card title="Transkrypcja OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Wielojęzyczna transkrypcja audio przez OpenRouter (Gemini i inne). Dostępne w ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill transkrypcji OpenRouter w ClawHub" />
</Card>

</CardGroup>

## Infrastruktura i wdrożenie

Pakowanie, wdrażanie i integracje, które ułatwiają uruchamianie i rozszerzanie OpenClaw.

<CardGroup cols={2}>

<Card title="Dodatek Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw działający w Home Assistant OS z obsługą tunelu SSH i trwałym stanem.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Steruj urządzeniami Home Assistant i automatyzuj je za pomocą języka naturalnego.

  <img src="/assets/showcase/homeassistant.png" alt="Skill Home Assistant w ClawHub" />
</Card>

<Card title="Pakietowanie Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Kompletna, znixyfikowana konfiguracja OpenClaw do powtarzalnych wdrożeń.
</Card>

<Card title="Kalendarz CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill kalendarza używający khal i vdirsyncer. Integracja z samodzielnie hostowanym kalendarzem.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill kalendarza CalDAV w ClawHub" />
</Card>

</CardGroup>

## Dom i sprzęt

Fizyczna strona OpenClaw: domy, czujniki, kamery, odkurzacze i inne urządzenia.

<CardGroup cols={2}>

<Card title="Automatyzacja GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Natywna dla Nix automatyzacja domu z OpenClaw jako interfejsem oraz pulpitami Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Pulpit Grafana GoHome" />
</Card>

<Card title="Odkurzacz Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Steruj swoim odkurzaczem robotem Roborock przez naturalną rozmowę.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Stan Roborock" />
</Card>

</CardGroup>

## Projekty społeczności

Rzeczy, które rozwinęły się poza pojedynczy przepływ pracy w szersze produkty lub ekosystemy.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Społeczność** • `marketplace` `astronomy` `webapp`

Pełny marketplace sprzętu astronomicznego. Zbudowany z ekosystemem OpenClaw i wokół niego.
</Card>

</CardGroup>

## Prześlij swój projekt

<Steps>
  <Step title="Udostępnij go">
    Opublikuj na [#self-promotion na Discord](https://discord.gg/clawd) lub [tweetnij do @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Dołącz szczegóły">
    Powiedz nam, co robi, dodaj link do repozytorium lub demonstracji i udostępnij zrzut ekranu, jeśli go masz.
  </Step>
  <Step title="Daj się wyróżnić">
    Dodamy wyróżniające się projekty do tej strony.
  </Step>
</Steps>

## Powiązane

- [Pierwsze kroki](/pl/start/getting-started)
- [OpenClaw](/pl/start/openclaw)
