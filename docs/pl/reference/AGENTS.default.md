---
read_when:
    - Uruchamianie nowej sesji agenta OpenClaw
    - Włączanie lub audyt domyślnych Skills
summary: Domyślne instrukcje agenta OpenClaw i zestaw Skills do konfiguracji osobistego asystenta
title: Domyślny plik AGENTS.md
x-i18n:
    generated_at: "2026-07-12T15:33:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Pierwsze uruchomienie (zalecane)

Agenci OpenClaw używają katalogu przestrzeni roboczej. Domyślnie: `~/.openclaw/workspace` (można skonfigurować za pomocą `agents.defaults.workspace`, obsługuje `~`).

1. Utwórz przestrzeń roboczą:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Skopiuj do niej domyślne szablony przestrzeni roboczej:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcjonalnie: zamiast ogólnego szablonu użyj zestawu umiejętności osobistego asystenta z tego pliku:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcjonalnie: wskaż inną przestrzeń roboczą:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Domyślne zasady bezpieczeństwa

- Nie wklejaj do czatu zawartości całych katalogów ani sekretów.
- Nie uruchamiaj destrukcyjnych poleceń bez wyraźnej prośby.
- Przed zmianą konfiguracji lub harmonogramów (crontab, jednostek systemd, konfiguracji nginx, plików rc powłoki) najpierw sprawdź istniejący stan i domyślnie zachowaj go lub scal zmiany.
- Nie wysyłaj częściowych ani strumieniowanych odpowiedzi do zewnętrznych usług komunikacyjnych (tylko odpowiedzi końcowe).

## Wstępne sprawdzenie istniejących rozwiązań

Przed zaproponowaniem lub zbudowaniem niestandardowego systemu, funkcji, przepływu pracy, narzędzia, integracji lub automatyzacji sprawdź, czy istnieją projekty open source, utrzymywane biblioteki, istniejące pluginy OpenClaw lub bezpłatne platformy, które rozwiązują ten problem wystarczająco dobrze. Preferuj je, gdy są odpowiednie. Buduj własne rozwiązanie tylko wtedy, gdy istniejące opcje są nieodpowiednie, zbyt drogie, nieutrzymywane, niebezpieczne lub niezgodne z wymaganiami albo gdy użytkownik wyraźnie prosi o rozwiązanie niestandardowe. Unikaj rekomendowania płatnych usług, chyba że użytkownik wyraźnie zatwierdzi wydatki. Traktuj to jako krótką kontrolę wstępną, a nie zadanie badawcze.

## Rozpoczęcie sesji (wymagane)

- Przed udzieleniem odpowiedzi przeczytaj `SOUL.md`, `USER.md` oraz wpisy z dzisiaj i wczoraj w katalogu `memory/`.
- Przeczytaj `MEMORY.md`, jeśli istnieje.

## Osobowość (wymagane)

- `SOUL.md` definiuje tożsamość, ton i granice. Dbaj o jego aktualność.
- Jeśli zmienisz `SOUL.md`, poinformuj o tym użytkownika.
- W każdej sesji jesteś nową instancją; ciągłość jest przechowywana w tych plikach.

## Przestrzenie współdzielone (zalecane)

- Nie wypowiadasz się w imieniu użytkownika; zachowaj ostrożność w czatach grupowych i kanałach publicznych.
- Nie udostępniaj prywatnych danych, informacji kontaktowych ani wewnętrznych notatek.

## System pamięci (zalecany)

- Dziennik dzienny: `memory/YYYY-MM-DD.md` (w razie potrzeby utwórz `memory/`).
- Pamięć długoterminowa: `MEMORY.md` na trwałe fakty, preferencje i decyzje.
- Plik `memory.md` pisany małymi literami służy wyłącznie jako starszy format danych wejściowych do naprawy; nie przechowuj celowo obu plików w katalogu głównym.
- Na początku sesji przeczytaj wpisy z dzisiaj i wczoraj oraz `MEMORY.md`, jeśli istnieje.
- Przed zapisaniem plików pamięci najpierw je przeczytaj; zapisuj tylko konkretne aktualizacje, nigdy puste symbole zastępcze.
- Zapisuj: decyzje, preferencje, ograniczenia i nierozwiązane sprawy.
- Unikaj sekretów, chyba że wyraźnie o nie poproszono.

## Narzędzia i umiejętności

- Narzędzia znajdują się w umiejętnościach; gdy ich potrzebujesz, postępuj zgodnie z plikiem `SKILL.md` każdej umiejętności.
- Notatki dotyczące konkretnego środowiska przechowuj w `TOOLS.md` (notatki dla umiejętności).

## Wskazówka dotycząca kopii zapasowej (zalecana)

Traktuj tę przestrzeń roboczą jako pamięć asystenta: utwórz w niej repozytorium git (najlepiej prywatne), aby tworzyć kopie zapasowe pliku `AGENTS.md` i plików pamięci.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Opcjonalnie: dodaj prywatne zdalne repozytorium i wypchnij zmiany
```

## Działanie OpenClaw

- Uruchamia Gateway kanałów komunikacyjnych (WhatsApp, Telegram, Discord, Signal, iMessage, Slack i inne) oraz osadzonego agenta, dzięki czemu asystent może odczytywać i zapisywać czaty, pobierać kontekst oraz uruchamiać umiejętności za pośrednictwem komputera hosta.
- Aplikacja na macOS zarządza uprawnieniami (nagrywanie ekranu, powiadomienia, mikrofon) i udostępnia CLI `openclaw` za pośrednictwem dołączonego pliku wykonywalnego.
- Czaty bezpośrednie są domyślnie łączone w sesję `main` agenta; grupy i kanały/pokoje otrzymują własne klucze sesji. Dokładne formaty kluczy opisano w sekcji [Trasowanie kanałów](/pl/channels/channel-routing). Heartbeat utrzymuje działanie zadań w tle.

## Podstawowe umiejętności (włącz w Settings → Skills)

Przykładowy zestaw dla przestrzeni roboczej osobistego asystenta; wybierz umiejętności pasujące do Twojej konfiguracji.

- **mcporter** — środowisko uruchomieniowe/CLI serwera narzędzi do zarządzania zewnętrznymi backendami umiejętności.
- **Peekaboo** — szybkie zrzuty ekranu w systemie macOS z opcjonalną analizą obrazu przez AI.
- **camsnap** — przechwytywanie klatek, klipów lub alertów ruchu z kamer bezpieczeństwa RTSP/ONVIF.
- **oracle** — CLI agenta zgodnego z OpenAI z odtwarzaniem sesji i sterowaniem przeglądarką.
- **eightctl** — sterowanie snem z poziomu terminala.
- **imsg** — wysyłanie, odczytywanie i strumieniowanie wiadomości iMessage oraz SMS.
- **wacli** — CLI WhatsApp: synchronizacja, wyszukiwanie i wysyłanie.
- **discord** — działania w Discord: reakcje, naklejki i ankiety. Używaj celów `user:<id>` lub `channel:<id>` (same identyfikatory numeryczne są niejednoznaczne).
- **gog** — CLI pakietu Google: Gmail, Kalendarz, Dysk i Kontakty.
- **spotify-player** — terminalowy klient Spotify do wyszukiwania, kolejkowania i sterowania odtwarzaniem.
- **sag** — synteza mowy ElevenLabs z interfejsem podobnym do polecenia `say` w macOS; domyślnie przesyła dźwięk do głośników.
- **Sonos CLI** — sterowanie głośnikami Sonos (wykrywanie/status/odtwarzanie/głośność/grupowanie) ze skryptów.
- **blucli** — odtwarzanie, grupowanie i automatyzacja odtwarzaczy BluOS ze skryptów.
- **OpenHue CLI** — sterowanie oświetleniem Philips Hue na potrzeby scen i automatyzacji.
- **OpenAI Whisper** — lokalna zamiana mowy na tekst do szybkiego dyktowania i transkrypcji poczty głosowej.
- **Gemini CLI** — modele Google Gemini dostępne z terminala do szybkich pytań i odpowiedzi.
- **agent-tools** — zestaw narzędzi użytkowych do automatyzacji i skryptów pomocniczych.

## Uwagi dotyczące użytkowania

- Do skryptów preferuj CLI `openclaw`; aplikacja komputerowa obsługuje uprawnienia.
- Uruchamiaj instalacje z karty Skills; przycisk instalacji jest ukryty, gdy wymagany plik wykonywalny jest już dostępny.
- Pozostaw Heartbeat włączony, aby asystent mógł planować przypomnienia, monitorować skrzynki odbiorcze i wyzwalać przechwytywanie obrazu z kamer.
- Interfejs Canvas działa w trybie pełnoekranowym z natywnymi nakładkami. Unikaj umieszczania kluczowych elementów sterujących przy górnej lewej, górnej prawej i dolnej krawędzi; zamiast polegać na wcięciach obszaru bezpiecznego, dodaj jawne marginesy układu.
- Do weryfikacji sterowanej przez przeglądarkę używaj CLI `openclaw browser` (dołączony plugin `browser`) z profilem Chrome/Brave/Edge/Chromium zarządzanym przez OpenClaw.
- Zarządzanie: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Inspekcja: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Działania: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Działania wymagają wartości `ref` z polecenia `snapshot` (selektory CSS nie są akceptowane w działaniach); użyj `evaluate`, gdy potrzebujesz wskazywania elementów w stylu `document.querySelector`.
- Dodaj `--json` do dowolnego polecenia inspekcji, aby uzyskać dane wyjściowe przeznaczone do odczytu maszynowego.

## Powiązane

- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)
- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
- [Trasowanie kanałów](/pl/channels/channel-routing)
