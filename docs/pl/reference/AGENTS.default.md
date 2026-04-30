---
read_when:
    - Rozpoczynanie nowej sesji agenta OpenClaw
    - Włączanie lub audytowanie domyślnych Skills
summary: Domyślne instrukcje agenta OpenClaw i lista Skills dla konfiguracji osobistego asystenta
title: Domyślny AGENTS.md
x-i18n:
    generated_at: "2026-04-30T10:16:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - osobisty asystent OpenClaw (domyślne)

## Pierwsze uruchomienie (zalecane)

OpenClaw używa dedykowanego katalogu roboczego dla agenta. Domyślnie: `~/.openclaw/workspace` (konfigurowalne przez `agents.defaults.workspace`).

1. Utwórz przestrzeń roboczą (jeśli jeszcze nie istnieje):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Skopiuj domyślne szablony przestrzeni roboczej do przestrzeni roboczej:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcjonalnie: jeśli chcesz listę Skills osobistego asystenta, zastąp AGENTS.md tym plikiem:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcjonalnie: wybierz inną przestrzeń roboczą, ustawiając `agents.defaults.workspace` (obsługuje `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Domyślne zasady bezpieczeństwa

- Nie wrzucaj katalogów ani sekretów do czatu.
- Nie uruchamiaj destrukcyjnych poleceń, chyba że zostaniesz o to wyraźnie poproszony.
- Nie wysyłaj częściowych/strumieniowych odpowiedzi na zewnętrzne powierzchnie komunikacyjne (tylko odpowiedzi końcowe).

## Początek sesji (wymagane)

- Przeczytaj `SOUL.md`, `USER.md` oraz dzisiejszy+wczorajszy dzień w `memory/`.
- Przeczytaj `MEMORY.md`, jeśli istnieje.
- Zrób to przed odpowiedzią.

## Dusza (wymagane)

- `SOUL.md` definiuje tożsamość, ton i granice. Utrzymuj go aktualnym.
- Jeśli zmienisz `SOUL.md`, powiedz o tym użytkownikowi.
- W każdej sesji jesteś świeżą instancją; ciągłość znajduje się w tych plikach.

## Współdzielone przestrzenie (zalecane)

- Nie jesteś głosem użytkownika; zachowaj ostrożność w czatach grupowych lub kanałach publicznych.
- Nie udostępniaj prywatnych danych, informacji kontaktowych ani wewnętrznych notatek.

## System pamięci (zalecane)

- Dziennik dzienny: `memory/YYYY-MM-DD.md` (utwórz `memory/`, jeśli potrzeba).
- Pamięć długoterminowa: `MEMORY.md` dla trwałych faktów, preferencji i decyzji.
- Małe `memory.md` to wyłącznie starsze wejście naprawcze; nie utrzymuj celowo obu plików w katalogu głównym.
- Na początku sesji przeczytaj dzisiejszy + wczorajszy dzień + `MEMORY.md`, jeśli istnieje.
- Zapisuj: decyzje, preferencje, ograniczenia, otwarte wątki.
- Unikaj sekretów, chyba że wyraźnie poproszono.

## Narzędzia i Skills

- Narzędzia znajdują się w Skills; postępuj zgodnie z `SKILL.md` każdego Skill, gdy go potrzebujesz.
- Notatki specyficzne dla środowiska trzymaj w `TOOLS.md` (notatki dla Skills).

## Wskazówka dotycząca kopii zapasowej (zalecane)

Jeśli traktujesz tę przestrzeń roboczą jako „pamięć” Clawd, zrób z niej repozytorium git (najlepiej prywatne), aby `AGENTS.md` i pliki pamięci miały kopię zapasową.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Co robi OpenClaw

- Uruchamia WhatsApp gateway + agenta kodującego Pi, aby asystent mógł czytać/pisać czaty, pobierać kontekst i uruchamiać Skills przez hosta Mac.
- Aplikacja macOS zarządza uprawnieniami (nagrywanie ekranu, powiadomienia, mikrofon) i udostępnia CLI `openclaw` przez dołączony plik binarny.
- Czaty bezpośrednie domyślnie zwijają się do sesji `main` agenta; grupy pozostają izolowane jako `agent:<agentId>:<channel>:group:<id>` (pokoje/kanały: `agent:<agentId>:<channel>:channel:<id>`); heartbeats utrzymują zadania w tle przy życiu.

## Podstawowe Skills (włącz w Ustawienia → Skills)

- **mcporter** — Środowisko wykonawcze/CLI serwera narzędzi do zarządzania zewnętrznymi backendami Skills.
- **Peekaboo** — Szybkie zrzuty ekranu macOS z opcjonalną analizą wizualną AI.
- **camsnap** — Przechwytuj klatki, klipy lub alerty ruchu z kamer bezpieczeństwa RTSP/ONVIF.
- **oracle** — Gotowe dla OpenAI CLI agenta z odtwarzaniem sesji i sterowaniem przeglądarką.
- **eightctl** — Kontroluj swój sen z terminala.
- **imsg** — Wysyłaj, czytaj i strumieniuj iMessage oraz SMS.
- **wacli** — CLI WhatsApp: synchronizuj, wyszukuj, wysyłaj.
- **discord** — Akcje Discord: reakcje, naklejki, ankiety. Używaj celów `user:<id>` lub `channel:<id>` (same identyfikatory numeryczne są niejednoznaczne).
- **gog** — CLI Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Terminalowy klient Spotify do wyszukiwania/kolejkowania/sterowania odtwarzaniem.
- **sag** — Mowa ElevenLabs z UX w stylu macOS `say`; domyślnie strumieniuje do głośników.
- **Sonos CLI** — Steruj głośnikami Sonos (wykrywanie/status/odtwarzanie/głośność/grupowanie) ze skryptów.
- **blucli** — Odtwarzaj, grupuj i automatyzuj odtwarzacze BluOS ze skryptów.
- **OpenHue CLI** — Sterowanie oświetleniem Philips Hue dla scen i automatyzacji.
- **OpenAI Whisper** — Lokalne rozpoznawanie mowy na tekst do szybkiego dyktowania i transkrypcji poczty głosowej.
- **Gemini CLI** — Modele Google Gemini z terminala do szybkich pytań i odpowiedzi.
- **agent-tools** — Zestaw narzędzi pomocniczych do automatyzacji i skryptów pomocniczych.

## Uwagi dotyczące użycia

- Preferuj CLI `openclaw` do skryptów; aplikacja Mac obsługuje uprawnienia.
- Uruchamiaj instalacje z karty Skills; ukrywa przycisk, jeśli plik binarny jest już dostępny.
- Pozostaw heartbeats włączone, aby asystent mógł planować przypomnienia, monitorować skrzynki odbiorcze i wyzwalać przechwytywanie z kamer.
- Canvas UI działa w trybie pełnoekranowym z natywnymi nakładkami. Unikaj umieszczania krytycznych kontrolek przy górnej lewej/górnej prawej/dolnej krawędzi; dodaj jawne marginesy w układzie i nie polegaj na wstawkach safe-area.
- Do weryfikacji sterowanej przeglądarką używaj `openclaw browser` (karty/status/zrzut ekranu) z profilem Chrome zarządzanym przez OpenClaw.
- Do inspekcji DOM używaj `openclaw browser eval|query|dom|snapshot` (oraz `--json`/`--out`, gdy potrzebujesz wyjścia maszynowego).
- Do interakcji używaj `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type wymagają referencji snapshot; używaj `evaluate` dla selektorów CSS).

## Powiązane

- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)
- [Środowisko wykonawcze agenta](/pl/concepts/agent)
