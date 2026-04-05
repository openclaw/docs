---
read_when:
    - Rozpoczynanie nowej sesji agenta OpenClaw
    - Włączanie lub audyt domyślnych Skills
summary: Domyślne instrukcje agenta OpenClaw i lista Skills dla konfiguracji osobistego asystenta
title: Domyślny AGENTS.md
x-i18n:
    generated_at: "2026-04-05T14:04:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - osobisty asystent OpenClaw (domyślnie)

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

3. Opcjonalnie: jeśli chcesz listę Skills dla osobistego asystenta, zastąp AGENTS.md tym plikiem:

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
- Nie uruchamiaj destrukcyjnych poleceń, chyba że zostaniesz o to wyraźnie poproszony.
- Nie wysyłaj częściowych/strumieniowych odpowiedzi do zewnętrznych powierzchni wiadomości (tylko odpowiedzi końcowe).

## Początek sesji (wymagane)

- Przeczytaj `SOUL.md`, `USER.md` oraz wpisy z dzisiaj i wczoraj w `memory/`.
- Przeczytaj `MEMORY.md`, jeśli istnieje; użyj małymi literami `memory.md` tylko wtedy, gdy `MEMORY.md` nie istnieje.
- Zrób to przed udzieleniem odpowiedzi.

## Soul (wymagane)

- `SOUL.md` definiuje tożsamość, ton i granice. Dbaj o jego aktualność.
- Jeśli zmienisz `SOUL.md`, powiedz o tym użytkownikowi.
- W każdej sesji jesteś świeżą instancją; ciągłość znajduje się w tych plikach.

## Wspólne przestrzenie (zalecane)

- Nie jesteś głosem użytkownika; zachowuj ostrożność w czatach grupowych lub kanałach publicznych.
- Nie udostępniaj danych prywatnych, informacji kontaktowych ani notatek wewnętrznych.

## System pamięci (zalecane)

- Dzienny dziennik: `memory/YYYY-MM-DD.md` (utwórz `memory/`, jeśli potrzeba).
- Pamięć długoterminowa: `MEMORY.md` na trwałe fakty, preferencje i decyzje.
- Pisane małymi literami `memory.md` to tylko starszy fallback; nie utrzymuj celowo obu plików głównych.
- Na początku sesji przeczytaj wpisy z dzisiaj + wczoraj + `MEMORY.md`, jeśli istnieje, w przeciwnym razie `memory.md`.
- Zapisuj: decyzje, preferencje, ograniczenia, otwarte wątki.
- Unikaj sekretów, chyba że zostaniesz o to wyraźnie poproszony.

## Narzędzia i Skills

- Narzędzia znajdują się w Skills; stosuj się do `SKILL.md` danego Skill, kiedy go potrzebujesz.
- Notatki specyficzne dla środowiska przechowuj w `TOOLS.md` (Notes for Skills).

## Wskazówka dotycząca kopii zapasowej (zalecane)

Jeśli traktujesz ten workspace jako „pamięć” Clawd, zrób z niego repozytorium git (najlepiej prywatne), aby `AGENTS.md` i pliki pamięci były objęte kopią zapasową.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opcjonalnie: dodaj prywatny zdalny remote + wypchnij
```

## Co robi OpenClaw

- Uruchamia bramę WhatsApp + agenta programistycznego Pi, aby asystent mógł czytać/pisać czaty, pobierać kontekst i uruchamiać Skills przez hosta Mac.
- Aplikacja macOS zarządza uprawnieniami (nagrywanie ekranu, powiadomienia, mikrofon) i udostępnia CLI `openclaw` przez dołączony plik binarny.
- Czaty bezpośrednie są domyślnie zwijane do sesji `main` agenta; grupy pozostają odizolowane jako `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały: `agent:<agentId>:<channel>:channel:<id>`); heartbeat utrzymują zadania w tle przy życiu.

## Główne Skills (włącz w Ustawienia → Skills)

- **mcporter** — środowisko uruchomieniowe serwera narzędzi/CLI do zarządzania zewnętrznymi backendami Skill.
- **Peekaboo** — szybkie zrzuty ekranu macOS z opcjonalną analizą obrazu przez AI.
- **camsnap** — przechwytuj klatki, klipy lub alerty ruchu z kamer bezpieczeństwa RTSP/ONVIF.
- **oracle** — gotowe dla OpenAI CLI agenta z odtwarzaniem sesji i sterowaniem przeglądarką.
- **eightctl** — kontroluj swój sen z terminala.
- **imsg** — wysyłaj, czytaj i strumieniuj iMessage oraz SMS.
- **wacli** — CLI WhatsApp: synchronizacja, wyszukiwanie, wysyłanie.
- **discord** — działania Discord: reakcje, naklejki, ankiety. Używaj celów `user:<id>` lub `channel:<id>` (same numeryczne identyfikatory są niejednoznaczne).
- **gog** — CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — terminalowy klient Spotify do wyszukiwania/dodawania do kolejki/sterowania odtwarzaniem.
- **sag** — mowa ElevenLabs z doświadczeniem podobnym do macOS `say`; domyślnie strumieniuje do głośników.
- **Sonos CLI** — sterowanie głośnikami Sonos (wykrywanie/status/odtwarzanie/głośność/grupowanie) ze skryptów.
- **blucli** — odtwarzaj, grupuj i automatyzuj odtwarzacze BluOS ze skryptów.
- **OpenHue CLI** — sterowanie oświetleniem Philips Hue dla scen i automatyzacji.
- **OpenAI Whisper** — lokalne zamienianie mowy na tekst do szybkiego dyktowania i transkrypcji poczty głosowej.
- **Gemini CLI** — modele Google Gemini z terminala do szybkich pytań i odpowiedzi.
- **agent-tools** — zestaw narzędzi pomocniczych do automatyzacji i skryptów pomocniczych.

## Uwagi dotyczące użycia

- Do skryptów preferuj CLI `openclaw`; aplikacja Mac obsługuje uprawnienia.
- Uruchamiaj instalacje z karty Skills; ukrywa przycisk, jeśli plik binarny jest już obecny.
- Utrzymuj włączone heartbeat, aby asystent mógł planować przypomnienia, monitorować skrzynki odbiorcze i wyzwalać przechwytywanie obrazu z kamer.
- UI Canvas działa na pełnym ekranie z natywnymi nakładkami. Unikaj umieszczania krytycznych elementów sterujących w lewym górnym/prawym górnym/dolnych krawędziach; dodawaj jawne marginesy w układzie i nie polegaj na insetach bezpiecznego obszaru.
- Do weryfikacji sterowanej przez przeglądarkę używaj `openclaw browser` (tabs/status/screenshot) z profilem Chrome zarządzanym przez OpenClaw.
- Do inspekcji DOM używaj `openclaw browser eval|query|dom|snapshot` (oraz `--json`/`--out`, gdy potrzebujesz danych maszynowych).
- Do interakcji używaj `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type wymagają odwołań do snapshotów; użyj `evaluate` dla selektorów CSS).
