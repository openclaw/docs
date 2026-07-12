---
read_when:
    - Umożliwianie agentowi Gateway wyświetlania pulpitu Maca i sterowania nim
    - Uzbrajanie, uprawnienia lub bezpieczeństwo podczas korzystania z komputera
    - Rozszerzanie polecenia węzła computer.act lub jego procedur obsługi
summary: Sterowanie pulpitem przez agenta na sparowanym węźle macOS za pomocą narzędzia computer i polecenia węzła computer.act
title: Obsługa komputera
x-i18n:
    generated_at: "2026-07-12T15:16:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

Funkcja obsługi komputera umożliwia agentowi Gateway wyświetlanie i sterowanie sparowanym pulpitem **macOS**: przechwytuje zrzut ekranu za pomocą istniejącego polecenia Node `screen.snapshot` oraz steruje wskaźnikiem i klawiaturą za pośrednictwem pojedynczego niebezpiecznego polecenia Node `computer.act`. Zestaw akcji odpowiada podstawowym akcjom obsługi komputera Anthropic; opcjonalne powiększanie `computer_20251124` nie jest udostępniane. Model obsługujący analizę obrazu steruje nim za pomocą wbudowanego narzędzia agenta `computer`.

Agent wysyła jedno ujednolicone polecenie `computer.act`; nie może ustalić, w jaki sposób Node je realizuje. Node macOS realizuje `computer.act` wewnątrz procesu za pomocą osadzonych usług Peekaboo oraz ograniczonego zestawu prymitywów CoreGraphics (prawidłowe uprawnienia TCC, bez dodatkowego procesu). Inne platformy mogą w przyszłości realizować to samo polecenie bez zmiany kontraktu udostępnianego agentowi.

## Wymagania

- Sparowany Node **macOS** (aplikacja OpenClaw dla macOS działająca w trybie Node).
- Włączone ustawienie aplikacji macOS **Allow Computer Control** (domyślnie wyłączone).
- Uprawnienie **Accessibility** systemu macOS przyznane aplikacji OpenClaw (do sterowania wskaźnikiem i klawiaturą) oraz uprawnienie **Screen Recording** (dla `screen.snapshot`).
- Polecenie `computer.act` uzbrojone w Gateway (jest niebezpieczne i domyślnie rozbrojone).
- Model agenta obsługujący analizę obrazu.
- Zasady narzędzi udostępniające `computer`. Domyślny profil `coding` go nie udostępnia. Dodaj `computer` do `tools.alsoAllow`; agenty działające w piaskownicy wymagają go również w `tools.sandbox.tools.alsoAllow`.

## Narzędzie agenta `computer`

Wbudowane narzędzie `computer` przyjmuje jedną akcję na wywołanie. Współrzędne to nieujemne, całkowite wartości pikseli na najnowszym zrzucie ekranu; Node przelicza je na punkty wyświetlacza. Akcje wykorzystujące współrzędne muszą przekazywać `frameId` z wyniku zrzutu ekranu, a jawnie podany `screenIndex` musi odpowiadać tej klatce. OpenClaw przenosi również z wydanego przez Node zrzutu ekranu do akcji tożsamość wyświetlacza, dzięki czemu ponowne podłączenie wyświetlacza lub zmiana jego geometrii powoduje bezpieczne przerwanie działania zamiast niezauważalnego skierowania akcji na ten sam indeks. Te kontrole odrzucają odgadnięte tokeny oraz tokeny pochodzące z innej dostarczonej klatki lub innego wyświetlacza. Token nie gwarantuje aktualności: aplikacje mogą zmienić piksele na tym samym wyświetlaczu po przechwyceniu, dlatego wykonaj nowy zrzut ekranu za każdym razem, gdy scena mogła się zmienić.

- Odczyt: `screenshot`.
- Wskaźnik: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (z `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Przewijanie: `scroll` z `scrollDirection` (`up|down|left|right`) i `scrollAmount` (skoki kółka myszy).
- Klawiatura: `type` (tekst), `key` (kombinacja, taka jak `cmd+shift+t` lub `Return`), `hold_key` (kombinacja w polu `text` przytrzymywana przez `duration` sekund).
- Sterowanie tempem: `wait` (`duration` sekund).

Klawisze modyfikujące są przekazywane w polu `text` akcji kliknięcia i przewijania (`shift`, `ctrl`, `alt`, `cmd`). Po akcji wejściowej narzędzie zwraca nowy zrzut ekranu, aby model mógł zaobserwować wynik. Jeśli podłączony jest więcej niż jeden Node obsługujący sterowanie komputerem, przekaż jawnie `node`.

Zrzuty ekranu są przeznaczone **wyłącznie dla modelu**: nigdy nie są automatycznie dostarczane do kanału czatu. Traktuj całą zawartość ekranu jako niezaufane dane wejściowe; narzędzie ostrzega model, aby nie wykonywał instrukcji widocznych na ekranie, które są sprzeczne z żądaniem użytkownika.

## Polecenie Node `computer.act`

`computer.act` jest pojedynczym poleceniem Node, przez które narzędzie kieruje dane wejściowe (`node.invoke` z `command: "computer.act"`). Jest ono:

- **Domyślnie niebezpieczne**: znajduje się na wbudowanej liście niebezpiecznych poleceń Node i jest wykluczone z listy dozwolonych poleceń środowiska uruchomieniowego do czasu jawnego uzbrojenia. Node macOS może mimo to zadeklarować je podczas parowania, dzięki czemu ten zakres funkcji jest zatwierdzany tylko raz.
- Obecnie dostępne **tylko w systemie macOS**: jest ogłaszane wyłącznie przez Node macOS z włączonym ustawieniem **Allow Computer Control**.

Odczyty ponownie wykorzystują `screen.snapshot`; nie istnieje druga ścieżka przechwytywania. Informacje o współdzielonym poleceniu przechwytywania zawiera strona [Node kamery i ekranu](/pl/nodes/camera).

## Włączanie i uzbrajanie

1. W aplikacji macOS włącz **Settings → Allow Computer Control**. Następnie otwórz **Settings → Permissions** i przyznaj uprawnienia **Accessibility** oraz **Screen Recording** w ustawieniach systemowych macOS.
2. Zatwierdź aktualizację parowania w Gateway (nowe polecenie wymusza ponowne parowanie).
3. Udostępnij narzędzie agentowi obsługującemu analizę obrazu. Dla domyślnego profilu `coding`:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Agenty działające w piaskownicy wymagają również tej drugiej bramy:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Uzbrój `computer.act` na ograniczony czas. Plugin `phone-control` udostępnia grupę `computer`:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   Uzbrojenie wymaga uprawnienia `operator.admin` (lub roli właściciela) i automatycznie wygasa. Starsza grupa `/phone arm all` celowo nie obejmuje sterowania pulpitem; użyj jawnej grupy `computer`. Uzbrojenie określa tylko, co Gateway może wywołać; aplikacja macOS nadal wymusza własne ustawienie **Allow Computer Control** oraz uprawnienia systemu operacyjnego.

Aby zapewnić trwałą autoryzację, dodaj `computer.act` do `gateway.nodes.allowCommands` **i usuń je z** `gateway.nodes.denyCommands`; lista odmów ma pierwszeństwo. Trwała autoryzacja nie wygasa automatycznie. Wpisy obecne przed użyciem `/phone arm` pozostają po użyciu `/phone disarm`; nie przekształcaj tymczasowego zezwolenia w trwałe, gdy jest ono uzbrojone.

Autoryzacja jest celowo rozdzielona między włączenie a użycie. Uzbrojenie lub
trwałe skonfigurowanie `computer.act` wymaga uprawnień administracyjnych.
Po uzbrojeniu uwierzytelniony operator z uprawnieniem `operator.write` może wywoływać
`computer.act` przez `node.invoke`, dopóki zezwolenie nie wygaśnie lub nie zostanie rozbrojone;
nie ma kontroli administracyjnej dla każdej akcji. Zatwierdzenie Node deklarującego
`computer.act` jedynie rejestruje zakres funkcji, aby można go było później uzbroić, i samo w sobie nie
umożliwia wywoływania.

## Bezpieczeństwo

- Przed autoryzacją wszystkie warstwy (zasady narzędzi, zasady poleceń Gateway, ustawienie macOS, Accessibility i Screen Recording) muszą być zgodne. Po uzbrojeniu akcje są wykonywane bez potwierdzania każdej z nich aż do wygaśnięcia lub użycia `/phone disarm`.
- Tekst jest wprowadzany po jednym grafemie. Anulowanie, rozłączenie, wstrzymanie, wyłączenie lub zastąpienie punktu końcowego zatrzymuje operację przed następnym grafemem, zamiast kontynuować wprowadzanie nieaktualnej pozostałej części.
- Zrzuty ekranu są przeznaczone wyłącznie dla modelu i nigdy nie są automatycznie wysyłane na czat (zgłoszenie [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Traktuj zawartość ekranu jako niezaufaną; może zawierać atak polegający na wstrzyknięciu instrukcji do promptu.

## Powiązanie z innymi ścieżkami sterowania pulpitem

Jest to ścieżka sterowana przez agenta. Strona [Most Peekaboo](/pl/platforms/mac/peekaboo) opisuje jej powiązanie z hostem PeekabooBridge, funkcją Codex Computer Use oraz bezpośrednim MCP `cua-driver`.
