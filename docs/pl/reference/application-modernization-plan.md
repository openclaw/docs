---
read_when:
    - Planowanie szeroko zakrojonej modernizacji aplikacji OpenClaw
    - Aktualizacja standardów implementacji frontendu przy pracach nad aplikacją lub Control UI
    - Przekształcanie szerokiego przeglądu jakości produktu w etapowe prace inżynieryjne
summary: Kompleksowy plan modernizacji aplikacji z aktualizacjami umiejętności dostarczania frontendu
title: Plan modernizacji aplikacji
x-i18n:
    generated_at: "2026-05-06T09:28:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Cel

Przesuń aplikację w stronę czystszego, szybszego i łatwiejszego w utrzymaniu produktu bez
psucia obecnych przepływów pracy ani ukrywania ryzyka w szerokich refaktoryzacjach. Prace powinny
trafiać jako małe, możliwe do przeglądu wycinki z dowodem dla każdej dotkniętej powierzchni.

## Zasady

- Zachowaj obecną architekturę, chyba że granica wyraźnie powoduje rotację zmian,
  koszt wydajnościowy lub błędy widoczne dla użytkownika.
- Preferuj najmniejszą poprawną poprawkę dla każdego problemu, potem powtarzaj.
- Oddziel wymagane poprawki od opcjonalnych dopracowań, aby opiekunowie mogli wdrażać prace o
  wysokiej wartości bez czekania na subiektywne decyzje.
- Dbaj, aby zachowanie skierowane do pluginów było udokumentowane i wstecznie zgodne.
- Zweryfikuj zachowanie wydane w produkcie, kontrakty zależności i testy przed stwierdzeniem, że
  regresja została naprawiona.
- Najpierw ulepsz główną ścieżkę użytkownika: wdrażanie, uwierzytelnianie, czat, konfigurację dostawcy,
  zarządzanie pluginami i diagnostykę.

## Faza 1: Audyt bazowy

Zinwentaryzuj obecną aplikację przed wprowadzaniem zmian.

- Zidentyfikuj najważniejsze przepływy pracy użytkownika i powierzchnie kodu, które za nie odpowiadają.
- Wypisz martwe affordancje, zduplikowane ustawienia, niejasne stany błędów i kosztowne
  ścieżki renderowania.
- Zbierz obecne polecenia walidacji dla każdej powierzchni.
- Oznacz problemy jako wymagane, zalecane lub opcjonalne.
- Udokumentuj znane blokery wymagające przeglądu właściciela, szczególnie zmiany API, bezpieczeństwa,
  wydania i kontraktu pluginów.

Definicja ukończenia:

- Jedna lista problemów z odwołaniami do plików od katalogu głównego repozytorium.
- Każdy problem ma ważność, powierzchnię właściciela, oczekiwany wpływ na użytkownika i proponowaną
  ścieżkę walidacji.
- Żadne spekulacyjne elementy porządkowania nie są mieszane z wymaganymi poprawkami.

## Faza 2: Porządkowanie produktu i UX

Nadaj priorytet widocznym przepływom pracy i usuń niejasności.

- Doprecyzuj teksty wdrażania i stany puste dotyczące uwierzytelniania modelu, statusu Gateway
  i konfiguracji pluginu.
- Usuń lub wyłącz martwe affordancje, gdy żadna akcja nie jest możliwa.
- Utrzymuj ważne akcje widoczne przy różnych szerokościach responsywnych zamiast ukrywać je
  za kruchymi założeniami układu.
- Skonsoliduj powtarzający się język statusów, aby błędy miały jedno źródło prawdy.
- Dodaj stopniowe ujawnianie ustawień zaawansowanych, zachowując szybką konfigurację podstawową.

Zalecana walidacja:

- Ręczna szczęśliwa ścieżka dla pierwszej konfiguracji i uruchomienia istniejącego użytkownika.
- Skoncentrowane testy dla każdej logiki routingu, utrwalania konfiguracji lub wyprowadzania statusu.
- Zrzuty ekranu przeglądarki dla zmienionych powierzchni responsywnych.

## Faza 3: Dopracowanie architektury frontendu

Popraw utrzymywalność bez szerokiego przepisywania.

- Przenieś powtarzane transformacje stanu UI do wąskich typowanych helperów.
- Oddziel odpowiedzialności pobierania danych, utrwalania i prezentacji.
- Preferuj istniejące hooki, magazyny i wzorce komponentów zamiast nowych abstrakcji.
- Dziel przerośnięte komponenty tylko wtedy, gdy zmniejsza to sprzężenie lub ułatwia testy.
- Unikaj wprowadzania szerokiego stanu globalnego dla lokalnych interakcji paneli.

Wymagane zabezpieczenia:

- Nie zmieniaj publicznego zachowania jako skutku ubocznego dzielenia plików.
- Zachowaj nienaruszone zachowanie dostępności dla menu, okien dialogowych, kart i nawigacji
  klawiaturą.
- Zweryfikuj, że stany ładowania, puste, błędu i optymistyczne nadal się renderują.

## Faza 4: Wydajność i niezawodność

Celuj w zmierzony ból zamiast szerokiej teoretycznej optymalizacji.

- Zmierz koszty uruchamiania, przejścia między trasami, dużej listy i transkryptu czatu.
- Zastąp powtarzane kosztowne dane pochodne memoizowanymi selektorami lub cache'owanymi
  helperami tam, gdzie profilowanie dowodzi wartości.
- Ogranicz możliwe do uniknięcia skanowania sieci lub systemu plików na gorących ścieżkach.
- Zachowaj deterministyczne porządkowanie dla promptu, rejestru, pliku, pluginu i wejść sieciowych
  przed konstrukcją ładunku modelu.
- Dodaj lekkie testy regresji dla gorących helperów i granic kontraktów.

Definicja ukończenia:

- Każda zmiana wydajności zapisuje bazę, oczekiwany wpływ, rzeczywisty wpływ i
  pozostałą lukę.
- Żadna poprawka wydajnościowa nie trafia wyłącznie na podstawie intuicji, gdy dostępny jest tani pomiar.

## Faza 5: Wzmocnienie typów, kontraktów i testów

Podnieś poprawność w punktach granicznych, od których zależą użytkownicy i autorzy pluginów.

- Zastąp luźne ciągi znaków w czasie wykonywania dyskryminowanymi uniami lub zamkniętymi listami kodów.
- Waliduj wejścia zewnętrzne istniejącymi helperami schematów lub zod.
- Dodaj testy kontraktowe wokół manifestów pluginów, katalogów dostawców, komunikatów protokołu Gateway
  i zachowania migracji konfiguracji.
- Utrzymuj ścieżki zgodności w przepływach doctor lub repair zamiast ukrytych migracji
  w czasie startu.
- Unikaj sprzężenia testowego z wewnętrznymi elementami pluginów; używaj fasad SDK i udokumentowanych
  barrelów.

Zalecana walidacja:

- `pnpm check:changed`
- Ukierunkowane testy dla każdej zmienionej granicy.
- `pnpm build`, gdy zmieniają się leniwe granice, pakowanie lub publikowane powierzchnie.

## Faza 6: Dokumentacja i gotowość wydania

Utrzymuj dokumentację skierowaną do użytkowników w zgodzie z zachowaniem.

- Aktualizuj dokumentację wraz ze zmianami zachowania, API, konfiguracji, wdrażania lub pluginów.
- Dodawaj wpisy changeloga tylko dla zmian widocznych dla użytkownika.
- Utrzymuj terminologię pluginów jako skierowaną do użytkownika; używaj wewnętrznych nazw pakietów tylko tam,
  gdzie są potrzebne dla kontrybutorów.
- Potwierdź, że instrukcje wydania i instalacji nadal odpowiadają obecnej powierzchni poleceń.

Definicja ukończenia:

- Odpowiednia dokumentacja jest aktualizowana w tej samej gałęzi co zmiany zachowania.
- Sprawdzenia wygenerowanej dokumentacji lub dryfu API przechodzą, gdy zostały dotknięte.
- Przekazanie wskazuje każdą pominiętą walidację i powód jej pominięcia.

## Zalecany pierwszy wycinek

Zacznij od zawężonego przeglądu Control UI i wdrażania:

- Przeaudytuj pierwszą konfigurację, gotowość uwierzytelniania dostawcy, status Gateway i powierzchnie
  konfiguracji pluginów.
- Usuń martwe akcje i wyjaśnij stany awarii.
- Dodaj lub zaktualizuj skoncentrowane testy dla wyprowadzania statusu i utrwalania konfiguracji.
- Uruchom `pnpm check:changed`.

Daje to wysoką wartość dla użytkownika przy ograniczonym ryzyku architektonicznym.

## Aktualizacja umiejętności frontendu

Użyj tej sekcji, aby zaktualizować frontendowy `SKILL.md` dostarczony z zadaniem
modernizacji. Jeśli przyjmujesz te wskazówki jako lokalną dla repozytorium umiejętność OpenClaw,
najpierw utwórz `.agents/skills/openclaw-frontend/SKILL.md`, zachowaj frontmatter,
który należy do tej docelowej umiejętności, a następnie dodaj lub zastąp treść
poniższą zawartością.

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
