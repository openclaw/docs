---
read_when:
    - Rozpoczynanie nowej sesji agenta OpenClaw
    - Włączanie lub audyt domyślnych Skills
summary: Domyślne instrukcje agenta OpenClaw i zestaw Skills dla konfiguracji osobistego asystenta
title: Domyślny `AGENTS.md`
x-i18n:
    generated_at: "2026-04-24T09:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - osobisty asystent OpenClaw (domyślnie)

## Pierwsze uruchomienie (zalecane)

OpenClaw używa dedykowanego katalogu obszaru roboczego dla agenta. Domyślnie: `~/.openclaw/workspace` (konfigurowalne przez `agents.defaults.workspace`).

1. Utwórz obszar roboczy (jeśli jeszcze nie istnieje):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Skopiuj domyślne szablony obszaru roboczego do obszaru roboczego:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcjonalnie: jeśli chcesz zestaw Skills osobistego asystenta, zastąp `AGENTS.md` tym plikiem:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcjonalnie: wybierz inny obszar roboczy, ustawiając `agents.defaults.workspace` (obsługuje `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Domyślne ustawienia bezpieczeństwa

- Nie zrzucaj katalogów ani sekretów do czatu.
- Nie uruchamiaj destrukcyjnych poleceń, jeśli nie zostałeś o to wyraźnie poproszony.
- Nie wysyłaj częściowych/streamingowych odpowiedzi do zewnętrznych powierzchni wiadomości (tylko odpowiedzi końcowe).

## Start sesji (wymagane)

- Odczytaj `SOUL.md`, `USER.md` oraz dzisiaj+wczoraj w `memory/`.
- Odczytaj `MEMORY.md`, jeśli istnieje.
- Zrób to przed udzieleniem odpowiedzi.

## Soul (wymagane)

- `SOUL.md` definiuje tożsamość, ton i granice. Utrzymuj go aktualnym.
- Jeśli zmienisz `SOUL.md`, poinformuj użytkownika.
- W każdej sesji jesteś nową instancją; ciągłość znajduje się w tych plikach.

## Współdzielone przestrzenie (zalecane)

- Nie jesteś głosem użytkownika; zachowaj ostrożność w czatach grupowych lub kanałach publicznych.
- Nie udostępniaj prywatnych danych, informacji kontaktowych ani notatek wewnętrznych.

## System pamięci (zalecane)

- Dzienny log: `memory/YYYY-MM-DD.md` (utwórz `memory/`, jeśli to potrzebne).
- Pamięć długoterminowa: `MEMORY.md` dla trwałych faktów, preferencji i decyzji.
- Małymi literami `memory.md` służy wyłącznie jako wejście do naprawy legacy; nie utrzymuj celowo obu plików głównych.
- Przy starcie sesji odczytaj dziś + wczoraj + `MEMORY.md`, jeśli istnieje.
- Zapisuj: decyzje, preferencje, ograniczenia, otwarte pętle.
- Unikaj sekretów, chyba że zostaniesz o to wyraźnie poproszony.

## Narzędzia i Skills

- Narzędzia znajdują się w Skills; gdy ich potrzebujesz, postępuj zgodnie z `SKILL.md` każdej Skill.
- Notatki specyficzne dla środowiska przechowuj w `TOOLS.md` (Notes for Skills).

## Wskazówka dotycząca kopii zapasowej (zalecane)

Jeśli traktujesz ten obszar roboczy jako „pamięć” Clawd, zrób z niego repozytorium git (najlepiej prywatne), aby `AGENTS.md` i pliki pamięci miały kopię zapasową.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opcjonalnie: dodaj prywatny remote + wypchnij
```

## Co robi OpenClaw

- Uruchamia gateway WhatsApp + agenta kodującego Pi, dzięki czemu asystent może czytać/zapisywać czaty, pobierać kontekst i uruchamiać Skills przez hosta Mac.
- Aplikacja macOS zarządza uprawnieniami (nagrywanie ekranu, powiadomienia, mikrofon) i udostępnia CLI `openclaw` przez dołączone binarium.
- Czaty bezpośrednie domyślnie zwijają się do sesji `main` agenta; grupy pozostają izolowane jako `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat utrzymują zadania w tle przy życiu.

## Główne Skills (włącz w Ustawienia → Skills)

- **mcporter** — runtime/CLI serwera narzędzi do zarządzania zewnętrznymi backendami Skills.
- **Peekaboo** — szybkie zrzuty ekranu macOS z opcjonalną analizą AI vision.
- **camsnap** — przechwytywanie klatek, klipów lub alertów ruchu z kamer bezpieczeństwa RTSP/ONVIF.
- **oracle** — gotowe na OpenAI CLI agenta z odtwarzaniem sesji i sterowaniem przeglądarką.
- **eightctl** — kontroluj swój sen z terminala.
- **imsg** — wysyłaj, czytaj i streamuj iMessage oraz SMS.
- **wacli** — CLI WhatsApp: synchronizacja, wyszukiwanie, wysyłanie.
- **discord** — akcje Discord: reakcje, naklejki, ankiety. Używaj celów `user:<id>` lub `channel:<id>` (same numeryczne identyfikatory są niejednoznaczne).
- **gog** — Google Suite CLI: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — terminalowy klient Spotify do wyszukiwania/kolejkowania/sterowania odtwarzaniem.
- **sag** — mowa ElevenLabs z UX w stylu macOS say; domyślnie streamuje do głośników.
- **Sonos CLI** — sterowanie głośnikami Sonos (wykrywanie/status/odtwarzanie/głośność/grupowanie) ze skryptów.
- **blucli** — odtwarzanie, grupowanie i automatyzacja odtwarzaczy BluOS ze skryptów.
- **OpenHue CLI** — sterowanie oświetleniem Philips Hue dla scen i automatyzacji.
- **OpenAI Whisper** — lokalne speech-to-text do szybkiego dyktowania i transkrypcji poczty głosowej.
- **Gemini CLI** — modele Google Gemini z terminala do szybkiego Q&A.
- **agent-tools** — zestaw narzędzi pomocniczych do automatyzacji i skryptów pomocniczych.

## Uwagi dotyczące użycia

- Do skryptowania preferuj CLI `openclaw`; aplikacja macOS zarządza uprawnieniami.
- Uruchamiaj instalacje z karty Skills; przycisk jest ukrywany, jeśli binarium jest już obecne.
- Utrzymuj Heartbeat włączone, aby asystent mógł planować przypomnienia, monitorować skrzynki odbiorcze i wyzwalać przechwytywanie z kamer.
- UI Canvas działa na pełnym ekranie z natywnymi nakładkami. Unikaj umieszczania krytycznych kontrolek w lewym górnym/prawym górnym/dolnych krawędziach; dodaj jawne marginesy w układzie i nie polegaj na safe-area insets.
- Do weryfikacji sterowanej przeglądarką używaj `openclaw browser` (tabs/status/screenshot) z profilem Chrome zarządzanym przez OpenClaw.
- Do inspekcji DOM używaj `openclaw browser eval|query|dom|snapshot` (oraz `--json`/`--out`, gdy potrzebujesz danych wyjściowych dla maszyn).
- Do interakcji używaj `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type wymagają ref ze snapshotu; używaj `evaluate` dla selektorów CSS).

## Powiązane

- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Runtime agenta](/pl/concepts/agent)
