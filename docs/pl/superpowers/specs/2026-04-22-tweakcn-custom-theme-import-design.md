---
x-i18n:
    generated_at: "2026-05-02T22:23:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Projekt importu niestandardowego motywu Tweakcn

Status: zatwierdzono w terminalu 2026-04-22

## Podsumowanie

Dodaj dokładnie jeden lokalny dla przeglądarki slot niestandardowego motywu Control UI, który można zaimportować z linku udostępniania tweakcn. Istniejące wbudowane rodziny motywów pozostają `claw`, `knot` i `dash`. Nowa rodzina `custom` zachowuje się jak zwykła rodzina motywów OpenClaw i obsługuje tryby `light`, `dark` oraz `system`, gdy zaimportowany ładunek tweakcn zawiera zarówno jasny, jak i ciemny zestaw tokenów.

Zaimportowany motyw jest przechowywany wyłącznie w bieżącym profilu przeglądarki wraz z pozostałymi ustawieniami Control UI. Nie jest zapisywany do konfiguracji Gateway i nie synchronizuje się między urządzeniami ani przeglądarkami.

## Problem

System motywów Control UI jest obecnie ograniczony do trzech zakodowanych na stałe rodzin motywów:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Użytkownicy mogą przełączać się między wbudowanymi rodzinami i wariantami trybu, ale nie mogą wprowadzić motywu z tweakcn bez edytowania CSS repozytorium. Oczekiwany wynik jest mniejszy niż ogólny system motywów: zachować trzy motywy wbudowane i dodać jeden kontrolowany przez użytkownika importowany slot, który można zastąpić z linku tweakcn.

## Cele

- Zachować istniejące wbudowane rodziny motywów bez zmian.
- Dodać dokładnie jeden importowany slot niestandardowy, nie bibliotekę motywów.
- Akceptować link udostępniania tweakcn albo bezpośredni URL `https://tweakcn.com/r/themes/{id}`.
- Utrwalać zaimportowany motyw tylko w lokalnym magazynie przeglądarki.
- Sprawić, aby importowany slot działał z istniejącymi kontrolkami trybów `light`, `dark` i `system`.
- Zachować bezpieczne zachowanie przy błędach: nieudany import nigdy nie psuje aktywnego motywu UI.

## Poza zakresem

- Brak biblioteki wielu motywów ani lokalnej dla przeglądarki listy importów.
- Brak utrwalania po stronie Gateway lub synchronizacji między urządzeniami.
- Brak dowolnego edytora CSS lub edytora surowego JSON motywu.
- Brak automatycznego ładowania zdalnych zasobów fontów z tweakcn.
- Brak próby obsługi ładunków tweakcn, które udostępniają tylko jeden tryb.
- Brak refaktoryzacji motywów w całym repozytorium poza punktami integracji wymaganymi dla Control UI.

## Decyzje użytkownika już podjęte

- Zachować trzy wbudowane motywy.
- Dodać jeden slot importu oparty na tweakcn.
- Przechowywać zaimportowany motyw w przeglądarce, nie w konfiguracji Gateway.
- Obsługiwać `light`, `dark` i `system` dla importowanego slotu.
- Nadpisanie niestandardowego slotu kolejnym importem jest zamierzonym zachowaniem.

## Zalecane podejście

Dodaj czwarty identyfikator rodziny motywów, `custom`, do modelu motywów Control UI. Rodzina `custom` staje się wybieralna tylko wtedy, gdy istnieje prawidłowy import tweakcn. Zaimportowany ładunek jest normalizowany do specyficznego dla OpenClaw rekordu niestandardowego motywu i przechowywany w lokalnym magazynie przeglądarki wraz z pozostałymi ustawieniami UI.

W czasie działania OpenClaw renderuje zarządzany tag `<style>`, który definiuje rozstrzygnięte bloki zmiennych CSS motywu niestandardowego:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Dzięki temu zmienne motywu niestandardowego są ograniczone do rodziny `custom` i nie przeciekają jako zmienne CSS inline do wbudowanych rodzin.

## Architektura

### Model motywu

Zaktualizuj `ui/src/ui/theme.ts`:

- Rozszerz `ThemeName`, aby obejmował `custom`.
- Rozszerz `ResolvedTheme`, aby obejmował `custom` i `custom-light`.
- Rozszerz `VALID_THEME_NAMES`.
- Zaktualizuj `resolveTheme()`, aby `custom` odzwierciedlał istniejące zachowanie rodzin:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> `custom` albo `custom-light` na podstawie preferencji systemu operacyjnego

Nie dodaje się starszych aliasów dla `custom`.

### Model utrwalania

Rozszerz utrwalanie `UiSettings` w `ui/src/ui/storage.ts` o jeden opcjonalny ładunek motywu niestandardowego:

- `customTheme?: ImportedCustomTheme`

Zalecany przechowywany kształt:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Uwagi:

- `sourceUrl` przechowuje oryginalne dane wejściowe użytkownika po normalizacji.
- `themeId` to identyfikator motywu tweakcn wyodrębniony z URL.
- `label` to pole `name` tweakcn, jeśli jest obecne, w przeciwnym razie `Custom`.
- `light` i `dark` są już znormalizowanymi mapami tokenów OpenClaw, nie surowymi ładunkami tweakcn.
- Zaimportowany ładunek znajduje się obok innych lokalnych dla przeglądarki ustawień i jest serializowany w tym samym dokumencie local-storage.
- Jeśli przechowywane dane motywu niestandardowego są nieobecne lub nieprawidłowe przy ładowaniu, zignoruj ładunek i wróć do `theme: "claw"`, gdy utrwalona rodzina była `custom`.

### Zastosowanie w czasie działania

Dodaj wąski menedżer arkusza stylów motywu niestandardowego w runtime Control UI, umieszczony w pobliżu `ui/src/ui/app-settings.ts` i `ui/src/ui/theme.ts`.

Odpowiedzialności:

- Tworzyć lub aktualizować jeden stabilny tag `<style id="openclaw-custom-theme">` w `document.head`.
- Emitować CSS tylko wtedy, gdy istnieje prawidłowy ładunek motywu niestandardowego.
- Usuwać zawartość tagu stylu, gdy ładunek zostanie wyczyszczony.
- Trzymać CSS wbudowanych rodzin w `ui/src/styles/base.css`; nie wplatać importowanych tokenów do arkusza stylów zapisanego w repozytorium.

Ten menedżer uruchamia się zawsze, gdy ustawienia są ładowane, zapisywane, importowane lub czyszczone.

### Selektory trybu jasnego

Implementacja powinna preferować `data-theme-mode="light"` do stylowania trybu jasnego między rodzinami zamiast specjalnie obsługiwać `custom-light`. Jeśli istniejący selektor jest przypięty do `data-theme="light"` i musi stosować się do każdej jasnej rodziny, rozszerz go w ramach tej pracy.

## UX importu

Zaktualizuj `ui/src/ui/views/config.ts` w sekcji `Appearance`:

- Dodaj kartę motywu `Custom` obok `Claw`, `Knot` i `Dash`.
- Pokaż kartę jako wyłączoną, gdy nie istnieje zaimportowany motyw niestandardowy.
- Dodaj panel importu pod siatką motywów z:
  - jednym polem tekstowym na link udostępniania tweakcn albo URL `/r/themes/{id}`
  - jednym przyciskiem `Import`
  - jedną ścieżką `Replace`, gdy niestandardowy ładunek już istnieje
  - jedną akcją `Clear`, gdy niestandardowy ładunek już istnieje
- Pokaż etykietę zaimportowanego motywu i host źródła, gdy istnieje ładunek.
- Jeśli aktywnym motywem jest `custom`, zaimportowanie zamiennika stosuje go natychmiast.
- Jeśli aktywnym motywem nie jest `custom`, import tylko zapisuje nowy ładunek do czasu, aż użytkownik wybierze kartę `Custom`.

Szybki wybór motywu w ustawieniach w `ui/src/ui/views/config-quick.ts` powinien także pokazywać `Custom` tylko wtedy, gdy istnieje ładunek.

## Parsowanie URL i zdalne pobieranie

Ścieżka importu w przeglądarce akceptuje:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Implementacja powinna znormalizować obie formy do:

- `https://tweakcn.com/r/themes/{id}`

Następnie przeglądarka pobiera bezpośrednio znormalizowany endpoint `/r/themes/{id}`.

Użyj wąskiego walidatora schematu dla zewnętrznego ładunku. Schemat zod jest preferowany, ponieważ jest to niezaufana granica zewnętrzna.

Wymagane pola zdalne:

- najwyższego poziomu `name` jako opcjonalny string
- `cssVars.theme` jako opcjonalny obiekt
- `cssVars.light` jako obiekt
- `cssVars.dark` jako obiekt

Jeśli brakuje `cssVars.light` albo `cssVars.dark`, odrzuć import. To celowe: zatwierdzone zachowanie produktu to pełna obsługa trybów, a nie najlepsza możliwa synteza brakującej strony.

## Mapowanie tokenów

Nie odzwierciedlaj zmiennych tweakcn na ślepo. Znormalizuj ograniczony podzbiór do tokenów OpenClaw i wyprowadź resztę w helperze.

### Tokeny importowane bezpośrednio

Z każdego bloku trybu tweakcn:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Ze współdzielonego `cssVars.theme`, gdy jest obecne:

- `font-sans`
- `font-mono`

Jeśli blok trybu nadpisuje `font-sans`, `font-mono` lub `radius`, wartość lokalna dla trybu wygrywa.

### Tokeny wyprowadzane dla OpenClaw

Importer wyprowadza zmienne wyłącznie dla OpenClaw z zaimportowanych kolorów bazowych:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Reguły wyprowadzania znajdują się w czystym helperze, aby można było testować je niezależnie. Dokładne formuły mieszania kolorów są szczegółem implementacyjnym, ale helper musi spełniać dwa ograniczenia:

- zachowywać czytelny kontrast zbliżony do intencji zaimportowanego motywu
- generować stabilny wynik dla tego samego zaimportowanego ładunku

### Tokeny ignorowane w v1

Te tokeny tweakcn są celowo ignorowane w pierwszej wersji:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Dzięki temu zakres pozostaje skupiony na tokenach, których bieżący Control UI faktycznie potrzebuje.

### Fonty

Ciągi stosu fontów są importowane, jeśli są obecne, ale OpenClaw nie ładuje zdalnych zasobów fontów w v1. Jeśli zaimportowany stos odwołuje się do fontów niedostępnych w przeglądarce, stosowane jest normalne zachowanie zapasowe.

## Zachowanie przy błędach

Nieudane importy muszą kończyć się bezpiecznie.

- Nieprawidłowy format URL: pokaż wbudowany błąd walidacji, nie pobieraj.
- Nieobsługiwany host lub kształt ścieżki: pokaż wbudowany błąd walidacji, nie pobieraj.
- Błąd sieci, odpowiedź inna niż OK albo zniekształcony JSON: pokaż wbudowany błąd, pozostaw bieżący przechowywany ładunek bez zmian.
- Błąd schematu lub brak bloków light/dark: pokaż wbudowany błąd, pozostaw bieżący przechowywany ładunek bez zmian.
- Akcja Clear:
  - usuwa przechowywany ładunek niestandardowy
  - usuwa zawartość zarządzanego tagu stylu niestandardowego
  - jeśli aktywny jest `custom`, przełącza rodzinę motywu z powrotem na `claw`
- Nieprawidłowy przechowywany ładunek niestandardowy przy pierwszym ładowaniu:
  - zignoruj przechowywany ładunek
  - nie emituj niestandardowego CSS
  - jeśli utrwalona rodzina motywu była `custom`, wróć do `claw`

W żadnym momencie nieudany import nie powinien pozostawić aktywnego dokumentu z częściowo zastosowanymi niestandardowymi zmiennymi CSS.

## Pliki, które prawdopodobnie zmienią się w implementacji

Pliki podstawowe:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Prawdopodobne nowe helpery:

- `ui/src/ui/custom-theme.ts`

Testy:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- nowe ukierunkowane testy parsowania URL i normalizacji ładunku

## Testowanie

Minimalne pokrycie implementacji:

- parsować URL linku udostępniania do identyfikatora motywu tweakcn
- normalizować `/themes/{id}` i `/r/themes/{id}` do URL pobierania
- odrzucać nieobsługiwane hosty i zniekształcone identyfikatory
- walidować kształt ładunku tweakcn
- mapować prawidłowy ładunek tweakcn do znormalizowanych jasnych i ciemnych map tokenów OpenClaw
- ładować i zapisywać niestandardowy ładunek w lokalnych dla przeglądarki ustawieniach
- rozstrzygać `custom` dla `light`, `dark` i `system`
- wyłączać wybór `Custom`, gdy nie istnieje ładunek
- stosować zaimportowany motyw natychmiast, gdy `custom` jest już aktywny
- wracać do `claw`, gdy aktywny motyw niestandardowy zostanie wyczyszczony

Cel weryfikacji ręcznej:

- zaimportować znany motyw tweakcn z ustawień
- przełączać się między `light`, `dark` i `system`
- przełączać między `custom` i rodzinami wbudowanymi
- przeładować stronę i potwierdzić, że zaimportowany motyw niestandardowy utrzymuje się lokalnie

## Uwagi dotyczące wdrożenia

Ta funkcja jest celowo mała. Jeśli użytkownicy później poproszą o wiele importowanych motywów, zmianę nazwy, eksport albo synchronizację między urządzeniami, potraktuj to jako kolejny projekt. Nie buduj z góry abstrakcji biblioteki motywów w tej implementacji.
