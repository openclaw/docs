---
read_when:
    - Uruchamianie nowej sesji agenta OpenClaw
    - Włączanie lub audyt domyślnych Skills
summary: Domyślne instrukcje agenta OpenClaw i lista Skills dla konfiguracji osobistego asystenta
title: Domyślny AGENTS.md
x-i18n:
    generated_at: "2026-06-27T18:17:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Pierwsze uruchomienie (zalecane)

OpenClaw używa dedykowanego katalogu workspace dla agenta. Domyślnie: `~/.openclaw/workspace` (konfigurowalne przez `agents.defaults.workspace`).

1. Utwórz workspace (jeśli jeszcze nie istnieje):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Skopiuj domyślne szablony workspace do workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcjonalnie: jeśli chcesz listę Skills osobistego asystenta, zastąp AGENTS.md tym plikiem:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcjonalnie: wybierz inny workspace, ustawiając `agents.defaults.workspace` (obsługuje `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Domyślne ustawienia bezpieczeństwa

- Nie wrzucaj katalogów ani sekretów do czatu.
- Nie uruchamiaj destrukcyjnych poleceń, chyba że wyraźnie o to poproszono.
- Przed zmianą konfiguracji lub harmonogramów (na przykład crontab, jednostek systemd, konfiguracji nginx albo plików rc powłoki) najpierw sprawdź istniejący stan i domyślnie zachowuj/scalaj.
- Nie wysyłaj częściowych/strumieniowanych odpowiedzi na zewnętrzne powierzchnie komunikacyjne (tylko odpowiedzi końcowe).

## Wstępne sprawdzenie istniejących rozwiązań

Przed zaproponowaniem lub zbudowaniem niestandardowego systemu, funkcji, workflow, narzędzia, integracji albo automatyzacji wykonaj krótkie sprawdzenie projektów open source, utrzymywanych bibliotek, istniejących pluginów OpenClaw albo darmowych platform, które już rozwiązują to wystarczająco dobrze. Preferuj je, gdy są odpowiednie. Buduj rozwiązanie niestandardowe tylko wtedy, gdy istniejące opcje są nieodpowiednie, zbyt drogie, nieutrzymywane, niebezpieczne, niezgodne z wymaganiami albo użytkownik wyraźnie prosi o rozwiązanie niestandardowe. Unikaj rekomendacji płatnych usług, chyba że użytkownik wyraźnie zatwierdzi wydatek. Zachowaj lekkość: to bramka wstępna, nie szerokie zadanie badawcze.

## Start sesji (wymagane)

- Przeczytaj `SOUL.md`, `USER.md` oraz dzisiaj+wczoraj w `memory/`.
- Przeczytaj `MEMORY.md`, gdy istnieje.
- Zrób to przed odpowiedzią.

## Dusza (wymagane)

- `SOUL.md` definiuje tożsamość, ton i granice. Utrzymuj go w aktualnym stanie.
- Jeśli zmienisz `SOUL.md`, powiedz o tym użytkownikowi.
- W każdej sesji jesteś świeżą instancją; ciągłość znajduje się w tych plikach.

## Przestrzenie współdzielone (zalecane)

- Nie jesteś głosem użytkownika; zachowaj ostrożność w czatach grupowych lub kanałach publicznych.
- Nie udostępniaj danych prywatnych, danych kontaktowych ani wewnętrznych notatek.

## System pamięci (zalecane)

- Dzienny dziennik: `memory/YYYY-MM-DD.md` (w razie potrzeby utwórz `memory/`).
- Pamięć długoterminowa: `MEMORY.md` na trwałe fakty, preferencje i decyzje.
- Małymi literami `memory.md` jest wyłącznie wejściem naprawczym legacy; nie utrzymuj celowo obu plików w katalogu głównym.
- Na początku sesji przeczytaj dzisiaj + wczoraj + `MEMORY.md`, gdy istnieje.
- Przed zapisem plików pamięci najpierw je przeczytaj; zapisuj tylko konkretne aktualizacje, nigdy puste placeholdery.
- Rejestruj: decyzje, preferencje, ograniczenia, otwarte pętle.
- Unikaj sekretów, chyba że wyraźnie o to poproszono.

## Narzędzia i Skills

- Narzędzia znajdują się w Skills; stosuj `SKILL.md` każdej Skills, gdy jej potrzebujesz.
- Notatki specyficzne dla środowiska przechowuj w `TOOLS.md` (Notatki dla Skills).

## Wskazówka dotycząca kopii zapasowej (zalecane)

Jeśli traktujesz ten workspace jako „pamięć” Clawd, zrób z niego repozytorium git (najlepiej prywatne), aby `AGENTS.md` i pliki pamięci miały kopię zapasową.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Co robi OpenClaw

- Uruchamia Gateway WhatsApp + osadzonego agenta OpenClaw, aby asystent mógł czytać/pisać czaty, pobierać kontekst i uruchamiać Skills przez hosta Mac.
- Aplikacja macOS zarządza uprawnieniami (nagrywanie ekranu, powiadomienia, mikrofon) i udostępnia CLI `openclaw` przez dołączony plik binarny.
- Czaty bezpośrednie domyślnie zwijają się do sesji `main` agenta; grupy pozostają odizolowane jako `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały: `agent:<agentId>:<channel>:channel:<id>`); heartbeaty utrzymują zadania w tle przy życiu.

## Główne Skills (włącz w Ustawienia → Skills)

- **mcporter** - Środowisko uruchomieniowe/CLI serwera narzędzi do zarządzania zewnętrznymi backendami Skills.
- **Peekaboo** - Szybkie zrzuty ekranu macOS z opcjonalną analizą przez AI vision.
- **camsnap** - Przechwytuj klatki, klipy lub alerty ruchu z kamer bezpieczeństwa RTSP/ONVIF.
- **oracle** - CLI agenta gotowe na OpenAI, z odtwarzaniem sesji i sterowaniem przeglądarką.
- **eightctl** - Kontroluj swój sen z terminala.
- **imsg** - Wysyłaj, czytaj i strumieniuj iMessage oraz SMS.
- **wacli** - CLI WhatsApp: synchronizuj, wyszukuj, wysyłaj.
- **discord** - Akcje Discord: reakcje, naklejki, ankiety. Używaj celów `user:<id>` lub `channel:<id>` (same identyfikatory numeryczne są niejednoznaczne).
- **gog** - CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Terminalowy klient Spotify do wyszukiwania/kolejkowania/sterowania odtwarzaniem.
- **sag** - Mowa ElevenLabs z UX w stylu macOS `say`; domyślnie strumieniuje do głośników.
- **Sonos CLI** - Steruj głośnikami Sonos (wykrywanie/status/odtwarzanie/głośność/grupowanie) ze skryptów.
- **blucli** - Odtwarzaj, grupuj i automatyzuj odtwarzacze BluOS ze skryptów.
- **OpenHue CLI** - Sterowanie oświetleniem Philips Hue dla scen i automatyzacji.
- **OpenAI Whisper** - Lokalne rozpoznawanie mowy na tekst do szybkiego dyktowania i transkrypcji poczty głosowej.
- **Gemini CLI** - Modele Google Gemini z terminala do szybkich pytań i odpowiedzi.
- **agent-tools** - Zestaw narzędzi pomocniczych do automatyzacji i skryptów pomocniczych.

## Uwagi dotyczące użycia

- Preferuj CLI `openclaw` do skryptowania; aplikacja Mac obsługuje uprawnienia.
- Uruchamiaj instalacje z karty Skills; ukrywa przycisk, jeśli plik binarny jest już obecny.
- Pozostaw heartbeaty włączone, aby asystent mógł planować przypomnienia, monitorować skrzynki odbiorcze i wyzwalać przechwytywanie z kamer.
- UI Canvas działa na pełnym ekranie z natywnymi nakładkami. Unikaj umieszczania krytycznych elementów sterujących przy górnej lewej/górnej prawej/dolnej krawędzi; dodaj jawne marginesy w układzie i nie polegaj na safe-area insets.
- Do weryfikacji sterowanej przeglądarką używaj `openclaw browser` (karty/status/zrzut ekranu) z profilem Chrome zarządzanym przez OpenClaw.
- Do inspekcji DOM używaj `openclaw browser eval|query|dom|snapshot` (oraz `--json`/`--out`, gdy potrzebujesz wyjścia maszynowego).
- Do interakcji używaj `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type wymagają referencji snapshot; używaj `evaluate` dla selektorów CSS).

## Powiązane

- [Workspace agenta](/pl/concepts/agent-workspace)
- [Środowisko uruchomieniowe agenta](/pl/concepts/agent)
