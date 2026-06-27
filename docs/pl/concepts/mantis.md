---
read_when:
    - Tworzenie lub uruchamianie wizualnego QA na żywo dla błędów OpenClaw
    - Dodawanie weryfikacji przed i po dla pull requestu
    - Dodawanie scenariuszy transportu na żywo dla Discord, Slack, WhatsApp lub innych
    - Debugowanie uruchomień QA wymagających zrzutów ekranu, automatyzacji przeglądarki lub dostępu VNC
summary: Mantis to wizualny system weryfikacji end-to-end służący do odtwarzania błędów OpenClaw w działających transportach, rejestrowania dowodów przed zmianą i po niej oraz dołączania artefaktów do PR-ów.
title: Modliszka
x-i18n:
    generated_at: "2026-06-27T17:26:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis to system weryfikacji end-to-end OpenClaw dla błędów, które wymagają prawdziwego
środowiska uruchomieniowego, prawdziwego transportu i widocznego dowodu. Uruchamia scenariusz na znanym
błędnym ref, przechwytuje dowody, uruchamia ten sam scenariusz na kandydującym ref i
publikuje porównanie jako artefakty, które maintainer może sprawdzić z PR lub
z polecenia lokalnego.

Mantis zaczyna od Discord, ponieważ Discord daje nam pierwszą ścieżkę o wysokiej wartości:
prawdziwe uwierzytelnianie bota, prawdziwe kanały guild, reakcje, wątki, polecenia natywne oraz
interfejs przeglądarkowy, w którym ludzie mogą wizualnie potwierdzić, co pokazał transport.

## Cele

- Odtworzyć błąd z issue lub PR w GitHub z tym samym kształtem transportu, który widzą
  użytkownicy.
- Przechwycić artefakt **przed** na bazowym ref przed zastosowaniem poprawki.
- Przechwycić artefakt **po** na kandydującym ref po zastosowaniu poprawki.
- Używać deterministycznej wyroczni zawsze, gdy to możliwe, takiej jak odczyt reakcji przez Discord REST
  lub sprawdzenie transkrypcji kanału.
- Przechwytywać zrzuty ekranu, gdy błąd ma widoczną powierzchnię UI.
- Uruchamiać lokalnie z CLI kontrolowanego przez agenta i zdalnie z GitHub.
- Zachować wystarczający stan maszyny do ratowania przez VNC, gdy logowanie, automatyzacja przeglądarki lub
  uwierzytelnianie providera się zablokują.
- Publikować zwięzły status na kanał operatora w Discord, gdy przebieg jest zablokowany,
  wymaga ręcznej pomocy VNC albo się kończy.

## Poza zakresem

- Mantis nie zastępuje testów jednostkowych. Przebieg Mantis zwykle powinien zostać
  mniejszym testem regresji po zrozumieniu poprawki.
- Mantis nie jest normalną szybką bramką CI. Jest wolniejszy, używa żywych poświadczeń i
  jest zarezerwowany dla błędów, w których środowisko live ma znaczenie.
- Mantis nie powinien wymagać człowieka w normalnym działaniu. Ręczne VNC to ścieżka ratunkowa,
  a nie ścieżka podstawowa.
- Mantis nie przechowuje surowych sekretów w artefaktach, logach, zrzutach ekranu, raportach Markdown
  ani komentarzach PR.

## Własność

Mantis żyje w stosie QA OpenClaw.

- OpenClaw jest właścicielem środowiska uruchomieniowego scenariuszy, adapterów transportu, schematu dowodów i
  lokalnego CLI pod `pnpm openclaw qa mantis`.
- QA Lab jest właścicielem elementów harnessu transportu live, pomocników przechwytywania przeglądarki i
  writerów artefaktów.
- Crabbox jest właścicielem rozgrzanych maszyn Linux, gdy potrzebna jest zdalna VM.
- GitHub Actions jest właścicielem zdalnego punktu wejścia workflow i retencji artefaktów.
- ClawSweeper jest właścicielem routingu komentarzy GitHub: parsowania poleceń maintainerów,
  dispatchowania workflow i publikowania końcowego komentarza PR.
- Agenci OpenClaw prowadzą Mantis przez Codex, gdy scenariusz wymaga agentowego setupu,
  debugowania lub raportowania stanu zablokowania.

Ta granica utrzymuje wiedzę o transporcie w OpenClaw, harmonogramowanie maszyn w
Crabbox, a klej workflow maintainerów w ClawSweeper.

## Kształt polecenia

Pierwsze polecenie lokalne weryfikuje bota Discord, guild, kanał, wysłanie wiadomości,
wysłanie reakcji i ścieżkę artefaktów:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Lokalny runner przed i po akceptuje taki kształt:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner tworzy odłączone worktree bazowe i kandydujące w katalogu wyjściowym,
instaluje zależności, buduje każdy ref, uruchamia scenariusz z
`--allow-failures`, a następnie zapisuje `baseline/`, `candidate/`, `comparison.json`
i `mantis-report.md`. Dla pierwszego scenariusza Discord udana weryfikacja
oznacza, że status baseline to `fail`, a status candidate to `pass`.

Drugi probe Discord przed/po celuje w załączniki wątków:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Ten scenariusz publikuje wiadomość nadrzędną z botem sterującym, tworzy prawdziwy wątek Discord,
wywołuje akcję `message.thread-reply` OpenClaw z repo-lokalnym
`filePath`, a następnie odpytuje wątek o odpowiedź SUT i nazwę pliku załącznika. Zrzut ekranu
baseline pokazuje odpowiedź bez załącznika; zrzut ekranu candidate
pokazuje oczekiwany załącznik `mantis-thread-report.md`.

Pierwszym prymitywem VM/przeglądarki jest desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Wydzierżawia lub ponownie wykorzystuje maszynę desktopową Crabbox, uruchamia widoczną przeglądarkę wewnątrz
sesji VNC, przechwytuje pulpit, pobiera artefakty z powrotem do lokalnego katalogu wyjściowego
i zapisuje polecenie ponownego połączenia w raporcie. Polecenie domyślnie używa
providera Hetzner, ponieważ jest to pierwszy provider z działającym pokryciem desktop/VNC
w ścieżce Mantis. Nadpisz go przez `--provider`, `--crabbox-bin` lub
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, gdy uruchamiasz wobec innej floty Crabbox.

Przydatne flagi desktop smoke:

- `--lease-id <cbx_...>` lub `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` ponownie używa rozgrzanego desktopu.
- `--browser-url <url>` zmienia stronę otwieraną w widocznej przeglądarce.
- `--html-file <path>` renderuje repo-lokalny artefakt HTML w widocznej przeglądarce. Mantis używa tego do przechwycenia wygenerowanej osi czasu reakcji statusów Discord przez prawdziwy desktop Crabbox.
- `--browser-profile-dir <remote-path>` ponownie używa zdalnego Chrome user-data-dir, aby trwały desktop Mantis mógł pozostać zalogowany między przebiegami. Używaj tego dla długowiecznego profilu przeglądarki Discord Web.
- `--browser-profile-archive-env <name>` przywraca archiwum Chrome user-data-dir `.tgz` w base64 z nazwanej zmiennej środowiskowej przed uruchomieniem przeglądarki. Używaj tego dla zalogowanych świadków, takich jak Discord Web. Domyślna zmienna env to `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` kontroluje długość przechwytywania MP4. Użyj dłuższego czasu dla wolnych zalogowanych aplikacji webowych, które potrzebują czasu na ustabilizowanie.
- `--keep-lease` lub `OPENCLAW_MANTIS_KEEP_VM=1` utrzymuje nowo utworzoną, poprawnie przechodzącą dzierżawę otwartą do inspekcji VNC. Nieudane przebiegi domyślnie utrzymują dzierżawę, gdy została utworzona, aby operator mógł ponownie się połączyć.
- `--class`, `--idle-timeout` i `--ttl` dostrajają rozmiar maszyny i czas życia dzierżawy.

Dla dowodów Discord Web Mantis używa dedykowanego konta przeglądającego zamiast
tokenu bota. Scenariusz live Discord API pozostaje wyrocznią: tworzy prawdziwy
wątek, wysyła `thread-reply` SUT i sprawdza załącznik przez Discord
REST. Gdy ustawione jest `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, scenariusz dodatkowo
zapisuje artefakt URL Discord Web. Gdy ustawione jest `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`,
pozostawia ten wątek dostępny wystarczająco długo, aby zalogowana przeglądarka mogła go otworzyć
i nagrać.

Workflow GitHub otwiera URL wątku candidate w Discord Web, przechwytuje
zrzut ekranu, nagrywa MP4 i generuje przycięty podgląd GIF, gdy dostępne jest
narzędziowanie mediów Crabbox. Preferuj trwałą ścieżkę profilu przeglądającego skonfigurowaną
przez `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, ponieważ pełne archiwa profilu Chrome
mogą przekroczyć limit rozmiaru sekretu GitHub. Dla małych/bootstrapowych profili
workflow może też przywrócić archiwum `.tgz` w base64 z
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Jeśli żadne źródło profilu nie jest
skonfigurowane, workflow nadal publikuje deterministyczne zrzuty ekranu załączników baseline/candidate
i loguje powiadomienie, że zalogowany świadek Discord Web został pominięty.

Pierwszym pełnym desktopowym prymitywem transportu jest Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Wydzierżawia lub ponownie wykorzystuje desktopową maszynę Crabbox, synchronizuje bieżący checkout do
VM, uruchamia `pnpm openclaw qa slack` wewnątrz tej VM, otwiera Slack Web w przeglądarce
VNC, przechwytuje widoczny pulpit i kopiuje zarówno artefakty Slack QA, jak i
zrzut ekranu VNC z powrotem do lokalnego katalogu wyjściowego. To pierwszy kształt Mantis,
w którym Gateway OpenClaw SUT i przeglądarka działają wewnątrz tej samej
desktopowej VM Linux.

Z `--gateway-setup` polecenie przygotowuje trwały jednorazowy katalog domowy OpenClaw
w `$HOME/.openclaw-mantis/slack-openclaw`, łata konfigurację Slack Socket Mode
dla wybranego kanału, uruchamia `openclaw gateway run` na porcie
`38973` i utrzymuje Chrome działający w sesji VNC. To tryb „zostaw mi
desktop Linux ze Slackiem i działającym claw”; bot-to-botowa ścieżka Slack QA
pozostaje domyślna, gdy `--gateway-setup` jest pominięte.

Wymagane wejścia dla `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` dla zdalnej ścieżki modelu. Jeśli lokalnie ustawione jest tylko
  `OPENAI_API_KEY`, Mantis mapuje je na `OPENCLAW_LIVE_OPENAI_KEY`
  przed wywołaniem Crabbox, aby przekazywanie env `OPENCLAW_*` przez Crabbox mogło przenieść je
  do VM.

Z `--gateway-setup --credential-source convex` Mantis dzierżawi poświadczenie Slack SUT
ze współdzielonej puli przed utworzeniem VM i przekazuje wydzierżawiony
identyfikator kanału, token aplikacji Socket Mode i token bota jako env runtime `OPENCLAW_MANTIS_SLACK_*`
wewnątrz desktopu. Dzięki temu workflow GitHub pozostają cienkie: potrzebują tylko
sekretu brokera Convex, a nie surowych tokenów bota ani aplikacji Slack.

Przydatne flagi Slack desktop:

- `--lease-id <cbx_...>` uruchamia ponownie na maszynie, na której operator już zalogował się do Slack Web przez VNC.
- `--gateway-setup` uruchamia trwały Gateway OpenClaw Slack w VM zamiast tylko uruchamiać bot-to-botową ścieżkę QA.
- `--keep-lease` utrzymuje VM Gateway otwartą do inspekcji VNC po sukcesie; `--no-keep-lease` zatrzymuje ją po zebraniu artefaktów.
- `--slack-url <url>` otwiera konkretny URL Slack Web. Bez niego Mantis wyprowadza `https://app.slack.com/client/<team>/<channel>` ze Slack `auth.test`, gdy token bota SUT jest dostępny.
- `--slack-channel-id <id>` kontroluje allowlistę kanałów Slack używaną przez setup Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` kontroluje trwały profil Chrome wewnątrz VM. Domyślnie to `$HOME/.config/openclaw-mantis/slack-chrome-profile`, więc ręczne logowanie Slack Web przetrwa ponowne przebiegi na tej samej dzierżawie.
- `--credential-source convex --credential-role ci` używa współdzielonej puli poświadczeń zamiast bezpośrednich tokenów env Slack.
- `--provider-mode`, `--model`, `--alt-model` i `--fast` są przekazywane do ścieżki Slack live.

Przebiegi approval checkpoint renderują migawki wiadomości Slack API do PNG checkpointów
dla bezpiecznego w CI dowodu wizualnego. `slack-desktop-smoke.png` jest dowodem Slack Web
tylko wtedy, gdy dzierżawa używa rozgrzanego profilu przeglądarki, który jest już zalogowany.

Workflow smoke GitHub to `Mantis Discord Smoke`. Workflow GitHub przed i po
dla pierwszego prawdziwego scenariusza to `Mantis Discord Status Reactions`. Akceptuje:

- `baseline_ref`: ref, który ma odtworzyć zachowanie tylko queued.
- `candidate_ref`: ref, który ma pokazać `queued -> thinking -> done`.

Checkoutuje ref harnessu workflow, buduje osobne worktree baseline i candidate,
uruchamia `discord-status-reactions-tool-only` wobec każdego worktree i
uploaduje `baseline/`, `candidate/`, `comparison.json` oraz `mantis-report.md` jako
artefakty Actions. Renderuje także HTML osi czasu każdej ścieżki w desktopowej
przeglądarce Crabbox i publikuje te zrzuty ekranu VNC obok deterministycznych
PNG osi czasu w komentarzu PR. Ten sam komentarz PR osadza lekkie
przycięte ruchem podglądy GIF wygenerowane przez `crabbox media preview`, linkuje do
pasujących przyciętych ruchem klipów MP4 i zachowuje pełne pliki MP4 z pulpitu do głębokiej
inspekcji. Zrzuty ekranu pozostają inline do szybkiego przeglądu. Workflow buduje
CLI Crabbox z `openclaw/crabbox` main, aby móc używać bieżących flag dzierżawy
desktop/przeglądarka przed wydaniem następnego binarnego wydania Crabbox.

`Mantis Scenario` to ogólny ręczny punkt wejścia. Przyjmuje `scenario_id`,
`candidate_ref`, opcjonalne `baseline_ref` i opcjonalne `pr_number`, a następnie
uruchamia przepływ pracy należący do scenariusza. Wrapper jest celowo cienki:
przepływy pracy scenariuszy nadal odpowiadają za konfigurację transportu,
poświadczenia, klasę VM, oczekiwaną wyrocznię i manifest artefaktów.

`Mantis Slack Desktop Smoke` to pierwszy przepływ pracy Slack VM. Pobiera
zaufany ref kandydata w osobnym worktree, dzierżawi pulpit Crabbox Linux,
uruchamia `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` względem
tego kandydata, otwiera Slack Web w przeglądarce VNC, nagrywa pulpit, generuje
podgląd przycięty do ruchu za pomocą `crabbox media preview`, przesyła cały
katalog artefaktów i opcjonalnie publikuje w docelowym PR komentarz z dowodami
inline. Domyślnie używa AWS do dzierżawy pulpitu i udostępnia ręczne wejście
dostawcy, aby operatorzy mogli przełączyć się na Hetzner, gdy pojemność AWS jest
wolna lub niedostępna. Użyj tej ścieżki, gdy chcesz „pulpit Linux ze Slackiem i
działającym pazurem”, zamiast wyłącznie transkryptu Slack typu bot-do-bota.

`Mantis Telegram Live` opakowuje istniejącą ścieżkę Telegram live QA w ten sam
potok dowodowy PR. Pobiera zaufany ref kandydata w osobnym worktree, uruchamia
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, zapisuje manifest `mantis-evidence.json` z podsumowania
Telegram QA, `qa-evidence.json` i artefaktów raportu, renderuje zredagowany HTML
dowodowy przez przeglądarkę pulpitu Crabbox, generuje GIF przycięty do ruchu za
pomocą `crabbox media preview` i publikuje komentarz z dowodami inline w PR, gdy
dostępny jest numer PR. Ta ścieżka jest wizualnym dowodem QA, a nie dowodem
zalogowania do Telegram Web: Telegram Bot API daje stabilne dowody wiadomości
live, ale stan logowania Telegram Web nie jest wymagany dla normalnej
automatyzacji Mantis.

`Mantis Telegram Desktop Proof` to agentowy wrapper przed/po dla natywnego
Telegram Desktop. Maintainer może uruchomić go z komentarza PR za pomocą
`@openclaw-mantis telegram desktop proof`, z UI Actions z instrukcjami w formie
dowolnej albo przez ogólny dispatcher `Mantis Scenario`. Przepływ pracy przekazuje
PR, ref bazowy, ref kandydata i instrukcje maintainerowi do Codex. Agent czyta
PR, decyduje, jakie zachowanie widoczne w Telegram udowadnia zmianę, uruchamia
ścieżkę dowodową Crabbox Telegram Desktop realnego użytkownika dla bazy i
kandydata, iteruje, aż natywne GIF-y będą użyteczne, zapisuje sparowane artefakty
`motionPreview` do `mantis-evidence.json`, przesyła pakiet i publikuje
dwukolumnową tabelę dowodową PR, gdy dostępny jest numer PR.

Do konfiguracji Telegram Desktop z udziałem człowieka użyj buildera scenariuszy:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder dzierżawi lub ponownie używa pulpitu Crabbox, instaluje natywny binarny
Telegram Desktop dla Linux, opcjonalnie przywraca archiwum sesji użytkownika,
konfiguruje OpenClaw z wydzierżawionym tokenem bota Telegram SUT, uruchamia
`openclaw gateway run` na porcie `38974`, publikuje wiadomość gotowości bota
sterującego w wydzierżawionej prywatnej grupie, a następnie przechwytuje zrzut
ekranu i MP4 z widocznego pulpitu VNC. Token bota nigdy nie loguje Telegram
Desktop; konfiguruje tylko OpenClaw. Viewer pulpitu jest osobną sesją użytkownika
Telegram przywracaną z `--telegram-profile-archive-env <name>` albo tworzoną
ręcznie przez VNC i utrzymywaną przy życiu za pomocą `--keep-lease`.

Przydatne flagi buildera Telegram desktop:

- `--lease-id <cbx_...>` ponownie uruchamia względem VM, na której operator już zalogował się do Telegram Desktop.
- `--telegram-profile-archive-env <name>` odczytuje z tej zmiennej env archiwum profilu Telegram Desktop `.tgz` zakodowane w base64 i przywraca je przed uruchomieniem.
- `--telegram-profile-dir <remote-path>` kontroluje zdalny katalog profilu Telegram Desktop. Domyślnie jest to `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` instaluje i otwiera Telegram Desktop bez konfigurowania OpenClaw.
- `--credential-source convex --credential-role ci` używa współdzielonego brokera poświadczeń zamiast bezpośrednich tokenów env Telegram.

Każdy scenariusz publikujący do PR zapisuje `mantis-evidence.json` obok swojego
raportu. Ten schemat jest przekazaniem między kodem scenariusza a komentarzami
GitHub:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Wartości `path` artefaktów są względne względem katalogu manifestu. Wartości
`targetPath` są ścieżkami względnymi pod skonfigurowanym prefiksem artefaktów
Mantis R2/S3. Publisher odrzuca przechodzenie po ścieżkach i pomija wpisy
oznaczone `"required": false`, gdy opcjonalne podglądy lub filmy są niedostępne.

Obsługiwane rodzaje artefaktów:

- `timeline`: deterministyczny zrzut ekranu scenariusza, zwykle przed/po.
- `desktopScreenshot`: zrzut ekranu pulpitu VNC/przeglądarki.
- `motionPreview`: animowany GIF inline wygenerowany z nagrania pulpitu.
- `motionClip`: MP4 przycięte do ruchu, które usuwa statyczny początek i koniec.
- `fullVideo`: pełne nagranie MP4 do dogłębnej inspekcji.
- `metadata`: pomocniczy JSON/log.
- `report`: raport Markdown.

Wielokrotnego użytku publisher to `scripts/mantis/publish-pr-evidence.mjs`.
Przepływy pracy wywołują go z manifestem, docelowym PR, głównym katalogiem
docelowym artefaktów, markerem komentarza, URL-em artefaktu Actions, URL-em
uruchomienia i źródłem żądania. Przesyła zadeklarowane artefakty do
skonfigurowanego bucketa Mantis R2/S3, buduje komentarz PR z podsumowaniem na
początku, obrazami/podglądami inline i linkowanymi filmami, a następnie
aktualizuje istniejący komentarz markera albo tworzy nowy. Przepływy pracy
publikują do `openclaw-crabbox-artifacts` z publicznymi URL-ami pod
`https://artifacts.openclaw.ai`. Podają wartości bucketa, regionu i publicznego
URL-a bezpośrednio. Publisher wielokrotnego użytku wymaga:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Możesz także uruchomić przebieg status-reactions bezpośrednio z komentarza PR:

```text
@openclaw-mantis discord status reactions
```

Wyzwalacz komentarza jest celowo wąski. Działa tylko na komentarzach pull request
od użytkowników z dostępem write, maintain lub admin i rozpoznaje tylko żądania
reakcji statusu Discord. Domyślnie używa znanego złego refa bazowego oraz SHA
bieżącego nagłówka PR jako kandydata. Maintainerzy mogą nadpisać dowolny ref:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA można również uruchomić z komentarza PR:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Domyślnie używa SHA bieżącego nagłówka PR jako kandydata i uruchamia
`telegram-status-command`. Maintainerzy mogą nadpisać `candidate=...`,
`provider=aws|hetzner` i `lease=<cbx_...>`, gdy potrzebują konkretnego refa albo
wstępnie rozgrzanego pulpitu Crabbox.

Przykłady poleceń ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Pierwsze polecenie jest jawne i skoncentrowane na scenariuszu. Drugie może
później mapować PR lub issue na rekomendowane scenariusze Mantis na podstawie
etykiet, zmienionych plików i ustaleń z przeglądu ClawSweeper.

## Cykl życia uruchomienia

1. Pozyskaj poświadczenia.
2. Przydziel lub ponownie użyj VM.
3. Przygotuj profil pulpitu/przeglądarki, gdy scenariusz wymaga dowodów UI.
4. Przygotuj czysty checkout dla refa bazowego.
5. Zainstaluj zależności i zbuduj tylko to, czego wymaga scenariusz.
6. Uruchom podrzędny OpenClaw Gateway z izolowanym katalogiem stanu.
7. Skonfiguruj transport live, dostawcę, model i profil przeglądarki.
8. Uruchom scenariusz i przechwyć dowody bazowe.
9. Zatrzymaj gateway i zachowaj logi.
10. Przygotuj ref kandydata w tej samej VM.
11. Uruchom ten sam scenariusz i przechwyć dowody kandydata.
12. Porównaj wyniki wyroczni i dowody wizualne.
13. Zapisz Markdown, JSON, logi, zrzuty ekranu i opcjonalne artefakty śledzenia.
14. Prześlij artefakty GitHub Actions.
15. Opublikuj zwięzłą wiadomość statusu PR lub Discord.

Scenariusz powinien móc zawieść na dwa różne sposoby:

- **Błąd odtworzony**: baza zawiodła w oczekiwany sposób.
- **Awaria harnessa**: konfiguracja środowiska, poświadczenia, Discord API, przeglądarka lub
  dostawca zawiodły, zanim wyrocznia błędu była znacząca.

Raport końcowy musi rozdzielać te przypadki, aby maintainerzy nie mylili
niestabilnego środowiska z zachowaniem produktu.

## Discord MVP

Pierwszy scenariusz powinien celować w reakcje statusu Discord w kanałach guild,
gdzie tryb dostarczania odpowiedzi źródłowej to `message_tool_only`.

Dlaczego jest to dobre ziarno Mantis:

- Jest widoczny w Discord jako reakcje na wiadomości wyzwalającej.
- Ma mocną wyrocznię REST przez stan reakcji wiadomości Discord.
- Ćwiczy rzeczywisty OpenClaw Gateway, auth bota Discord, dispatch wiadomości,
  tryb dostarczania odpowiedzi źródłowej, stan reakcji statusu i cykl życia tury modelu.
- Jest wystarczająco wąski, aby pierwsza implementacja pozostała rzetelna.

Oczekiwany kształt scenariusza:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Dowody bazowe powinny pokazywać reakcję potwierdzenia w kolejce, ale bez
przejścia cyklu życia w trybie tool-only. Dowody kandydata powinny pokazywać
reakcje statusu cyklu życia działające, gdy `messages.statusReactions.enabled`
jest jawnie ustawione na true.

Pierwszym wykonywalnym wycinkiem jest opt-in scenariusz Discord live QA:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Konfiguruje SUT z zawsze włączoną obsługą guild, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` i jawnymi reakcjami statusu. Wyrocznia
odpytuje rzeczywistą wiadomość wyzwalającą Discord i oczekuje zaobserwowanej
sekwencji `👀 -> 🤔 -> 👍`. Artefakty obejmują
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` i
`discord-status-reactions-tool-only-timeline.png`.

## Istniejące elementy QA

Mantis powinien budować na istniejącym prywatnym stosie QA zamiast zaczynać od
zera:

- `pnpm openclaw qa discord` już uruchamia ścieżkę Discord live z botami driver i
  SUT.
- Runner transportu live już zapisuje raporty, dowody QA i artefakty specyficzne
  dla transportu pod `.artifacts/qa-e2e/`.
- Dzierżawy poświadczeń Convex już zapewniają wyłączny dostęp do współdzielonych
  poświadczeń transportu live.
- Usługa sterowania przeglądarką już obsługuje zrzuty ekranu, snapshoty,
  zarządzane profile headless i zdalne profile CDP.
- QA Lab ma już UI debuggera i magistralę do testowania w kształcie transportu.

Pierwsza implementacja Mantis może być cienkim runnerem przed/po nad tymi
elementami, plus jedna warstwa dowodów wizualnych.

## Model dowodów

Każde uruchomienie zapisuje stabilny katalog artefaktów:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` powinien być maszynowo odczytywalnym źródłem prawdy. Raport
Markdown jest przeznaczony do komentarzy PR i przeglądu przez ludzi.

Podsumowanie musi zawierać:

- testowane refy i SHA
- transport i identyfikator scenariusza
- dostawcę maszyny oraz identyfikator maszyny lub identyfikator dzierżawy
- źródło poświadczeń bez wartości sekretów
- wynik wersji bazowej
- wynik wersji kandydującej
- czy błąd został odtworzony na wersji bazowej
- czy wersja kandydująca go naprawiła
- ścieżki artefaktów
- oczyszczone problemy konfiguracji lub sprzątania

Zrzuty ekranu są dowodem, nie sekretami. Nadal wymagają dyscypliny redakcji:
mogą pojawić się prywatne nazwy kanałów, nazwy użytkowników lub treść wiadomości. W przypadku publicznych PR
preferuj linki do artefaktów GitHub Actions zamiast obrazów osadzonych, dopóki strategia redakcji
nie będzie mocniejsza.

## Przeglądarka i VNC

Ścieżka przeglądarki ma dwa tryby:

- **Automatyzacja bez interfejsu graficznego**: domyślna dla CI. Chrome działa z włączonym CDP, a
  Playwright lub sterowanie przeglądarką OpenClaw przechwytuje zrzuty ekranu.
- **Ratunkowy VNC**: włączony na tej samej VM, gdy logowanie, MFA, antyautomatyzacja Discord
  lub wizualne debugowanie wymaga człowieka.

Profil przeglądarki obserwatora Discord powinien być wystarczająco trwały, aby uniknąć
logowania przy każdym uruchomieniu, ale odizolowany od osobistego stanu przeglądarki. Profil
należy do puli maszyn Mantis, a nie do laptopa dewelopera.

Gdy Mantis się zablokuje, publikuje wiadomość statusową Discord z:

- identyfikatorem uruchomienia
- identyfikatorem scenariusza
- dostawcą maszyny
- katalogiem artefaktów
- instrukcjami połączenia VNC lub noVNC, jeśli są dostępne
- krótkim tekstem blokera

Pierwsze prywatne wdrożenie może publikować te wiadomości w istniejącym kanale operatorów,
a później przenieść je do dedykowanego kanału Mantis.

## Maszyny

Mantis powinien preferować AWS przez Crabbox dla pierwszej zdalnej implementacji.
Crabbox zapewnia nam wstępnie rozgrzane maszyny, śledzenie dzierżaw, hydratację, logi, wyniki i
sprzątanie. Jeśli pojemność AWS jest zbyt wolna lub niedostępna, dodaj dostawcę Hetzner
za tym samym interfejsem maszyny.

Minimalne wymagania VM:

- Linux z instalacją Chrome lub Chromium zdolną do pracy z pulpitem
- dostęp CDP do automatyzacji przeglądarki
- VNC lub noVNC do działań ratunkowych
- Node 22 i pnpm
- checkout OpenClaw i cache zależności
- cache przeglądarki Playwright Chromium, gdy używany jest Playwright
- wystarczająco dużo CPU i pamięci dla jednego OpenClaw Gateway, jednej przeglądarki i jednego uruchomienia modelu
- dostęp wychodzący do Discord, GitHub, dostawców modeli i brokera poświadczeń

VM nie powinna przechowywać długotrwałych surowych sekretów poza oczekiwanymi magazynami poświadczeń lub
profili przeglądarki.

## Sekrety

Sekrety znajdują się w sekretach organizacji lub repozytorium GitHub dla uruchomień zdalnych oraz w
lokalnym pliku sekretów kontrolowanym przez operatora dla uruchomień lokalnych.

Zalecane nazwy sekretów:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` dla publicznych przesyłań artefaktów GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Docelowo pula poświadczeń Convex powinna pozostać normalnym źródłem poświadczeń transportu
na żywo. Sekrety GitHub inicjują brokera i ścieżki awaryjne.
Przepływ reakcji statusowych Discord mapuje sekrety Mantis Crabbox z powrotem na
zmienne środowiskowe `CRABBOX_COORDINATOR` i `CRABBOX_COORDINATOR_TOKEN`,
których oczekuje CLI Crabbox. Zwykłe nazwy sekretów GitHub `CRABBOX_*` pozostają
akceptowane jako awaryjna zgodność.

Runner Mantis nigdy nie może drukować:

- tokenów botów Discord
- kluczy API dostawców
- ciasteczek przeglądarki
- zawartości profili uwierzytelniania
- haseł VNC
- surowych ładunków poświadczeń

Publiczne przesyłania artefaktów powinny także redagować metadane celu Discord, takie jak identyfikatory bota,
gildii, kanału i wiadomości. Przepływ smoke GitHub włącza
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` z tego powodu.

Jeśli token zostanie przypadkowo wklejony do issue, PR, czatu lub logu, obróć go
po zapisaniu nowego sekretu.

## Artefakty GitHub i komentarze PR

Przepływy Mantis powinny przesyłać pełny pakiet dowodowy jako krótkotrwały artefakt Actions.
Gdy przepływ jest uruchamiany dla zgłoszenia błędu lub PR z poprawką, powinien także
opublikować zredagowane media osadzone w skonfigurowanym bucketcie Mantis R2/S3 i zaktualizować lub utworzyć
komentarz do tego błędu lub PR z poprawką z osadzonymi zrzutami ekranu przed/po. Nie publikuj
głównego dowodu wyłącznie w ogólnym PR automatyzacji QA. Surowe logi, zaobserwowane
wiadomości i inne obszerne dowody pozostają w artefakcie Actions.

Przepływy produkcyjne powinny publikować te komentarze za pomocą GitHub App Mantis, a nie
`github-actions[bot]`. Zapisz identyfikator aplikacji i klucz prywatny jako sekrety GitHub Actions
`MANTIS_GITHUB_APP_ID` i `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Przepływ używa ukrytego znacznika jako klucza upsert, aktualizuje ten
komentarz, gdy token może go edytować, i tworzy nowy komentarz należący do Mantis, gdy
starszy znacznik należący do bota nie może zostać edytowany.

Komentarz PR powinien być krótki i wizualny:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Gdy uruchomienie kończy się niepowodzeniem, ponieważ harness się nie powiódł, komentarz musi to powiedzieć
zamiast sugerować, że wersja kandydująca zawiodła.

## Notatki dotyczące prywatnego wdrożenia

Prywatne wdrożenie może już mieć aplikację Mantis Discord. Użyj ponownie tej
aplikacji zamiast tworzyć kolejną, gdy ma właściwe uprawnienia bota
i może być bezpiecznie obrócona.

Ustaw początkowy kanał powiadomień operatora przez sekrety lub konfigurację
wdrożenia. Na początku może wskazywać istniejący kanał maintainerów lub operacyjny,
a następnie przenieść się do dedykowanego kanału Mantis, gdy taki powstanie.

Nie umieszczaj identyfikatorów gildii, identyfikatorów kanałów, tokenów botów, ciasteczek przeglądarki ani haseł VNC
w tym dokumencie. Przechowuj je w sekretach GitHub, brokerze poświadczeń lub
lokalnym magazynie sekretów operatora.

## Dodawanie scenariusza

Scenariusz Mantis powinien deklarować:

- identyfikator i tytuł
- transport
- wymagane poświadczenia
- politykę refa wersji bazowej
- politykę refa wersji kandydującej
- łatkę konfiguracji OpenClaw
- kroki konfiguracji
- bodziec
- oczekiwaną wyrocznię wersji bazowej
- oczekiwaną wyrocznię wersji kandydującej
- cele przechwytywania wizualnego
- budżet czasu oczekiwania
- kroki sprzątania

Scenariusze powinny preferować małe, typowane wyrocznie:

- stan reakcji Discord dla błędów reakcji
- referencje wiadomości Discord dla błędów wątkowania
- ts wątku Slack i stan API reakcji dla błędów Slack
- identyfikatory wiadomości e-mail i nagłówki dla błędów e-mail
- zrzuty ekranu przeglądarki, gdy UI jest jedyną wiarygodną obserwacją

Kontrole wizyjne powinny być addytywne. Jeśli API platformy może udowodnić błąd, użyj
API jako wyroczni pass/fail i zachowaj zrzuty ekranu dla zaufania ludzi.

## Rozszerzenie dostawców

Po Discord ten sam runner może dodać:

- Slack: reakcje, wątki, wzmianki aplikacji, modale, przesyłanie plików.
- E-mail: uwierzytelnianie Gmail i wątkowanie wiadomości przy użyciu `gog`, gdy konektory nie
  wystarczają.
- WhatsApp: logowanie QR, ponowna identyfikacja, dostarczanie wiadomości, media, reakcje.
- Telegram: bramkowanie wzmianek grupowych, polecenia, reakcje tam, gdzie są dostępne.
- Matrix: szyfrowane pokoje, relacje wątków lub odpowiedzi, wznawianie po restarcie.

Każdy transport powinien mieć jeden tani scenariusz smoke i jeden lub więcej scenariuszy
klas błędów. Kosztowne scenariusze wizualne powinny pozostać opt-in.

## Otwarte pytania

- Który bot Discord powinien być sterownikiem, a który SUT, gdy
  istniejący bot Mantis jest używany ponownie?
- Czy logowanie przeglądarki obserwatora powinno używać ludzkiego konta Discord, konta testowego,
  czy w pierwszej fazie wyłącznie dowodów REST czytelnych dla bota?
- Jak długo GitHub powinien przechowywać artefakty Mantis dla PR?
- Kiedy ClawSweeper powinien automatycznie rekomendować Mantis zamiast czekać na
  polecenie maintainera?
- Czy zrzuty ekranu powinny być redagowane lub kadrowane przed przesłaniem dla publicznych PR?
