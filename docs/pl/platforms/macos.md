---
read_when:
    - Instalowanie aplikacji macOS
    - Wybór między lokalnym a zdalnym trybem Gateway w systemie macOS
    - Szukanie plików do pobrania dla wydań aplikacji na macOS
summary: Zainstaluj aplikację OpenClaw na macOS działającą na pasku menu i korzystaj z niej
title: aplikacja na macOS
x-i18n:
    generated_at: "2026-07-16T18:48:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

Aplikacja macOS jest **towarzyszem OpenClaw na pasku menu**: natywny interfejs zasobnika, monity o uprawnienia macOS, powiadomienia, WebChat, wprowadzanie głosowe, Canvas oraz narzędzia Node hostowane na Macu, takie jak `system.run`.

Potrzebne są tylko CLI i Gateway? Zacznij od [Wprowadzenia](/pl/start/getting-started).

## Pobieranie

Pobierz kompilacje aplikacji macOS ze strony [wydań OpenClaw w GitHub](https://github.com/openclaw/openclaw/releases).
Jeśli wydanie zawiera zasoby aplikacji macOS, szukaj:

- `OpenClaw-<version>.dmg` (zalecane)
- `OpenClaw-<version>.zip`

Niektóre wydania zawierają tylko CLI, materiały dowodowe lub zasoby dla systemu Windows. Jeśli najnowsze wydanie
nie zawiera zasobu aplikacji macOS, użyj najnowszego, które go zawiera, albo skompiluj aplikację ze źródeł zgodnie z
[instrukcją konfiguracji środowiska programistycznego macOS](/pl/platforms/mac/dev-setup).

## Pierwsze uruchomienie

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Wybierz **This Mac** dla lokalnego Gateway albo połącz się ze zdalnym Gateway.
3. Poczekaj, aż aplikacja zainstaluje zgodne środowisko uruchomieniowe CLI. W trybie lokalnym również
   instaluje i uruchamia Gateway.
4. Nawiąż wnioskowanie za pomocą testu aktywnego modelu. Po pomyślnym przejściu testu OpenClaw
   zajmie się pozostałą konfiguracją.
5. Ukończ listę kontrolną uprawnień macOS i wyślij testową wiadomość wdrożeniową.

Jeśli aplikacja uzyska dostęp do istniejącego Gateway, którego domyślny agent ma skonfigurowany
model, uzna ten Gateway za już skonfigurowany, pominie wdrażanie dostawcy i
OpenClaw oraz otworzy pulpit. Jeśli nie można połączyć się z Gateway lub jego
domyślny agent nie ma modelu, wdrażanie wnioskowania pozostanie dostępne w celu
odzyskiwania działania.

Aby skonfigurować CLI/Gateway, skorzystaj z [Wprowadzenia](/pl/start/getting-started).
Aby odzyskać uprawnienia, zobacz [uprawnienia macOS](/pl/platforms/mac/permissions).

## Aktualizacje

Karta aktualizacji na pulpicie wskazuje, co aplikacja zaktualizuje:

- **Aktualizuj aplikację Mac + Gateway** oznacza, że podpisana aplikacja zarządza lokalnym Gateway uruchamianym przez launchd.
  Sparkle najpierw aktualizuje aplikację; po jej ponownym uruchomieniu aplikacja automatycznie
  aktualizuje i ponownie uruchamia swój Gateway w zgodnej wersji, a następnie weryfikuje
  połączenie.
- **Aktualizuj Gateway** oznacza, że aplikacja jest połączona ze zdalnym Gateway, ręcznie
  zarządzanym lokalnym Gateway lub inną instalacją, którą aplikacja nie zarządza. Przycisk
  uruchamia standardowy proces aktualizacji tego Gateway zamiast zmieniać aplikację Mac.

Nieudana skoordynowana aktualizacja pozostaje w oknie przypominającym konfigurację, z możliwością ponowienia,
[przewodnikiem po aktualizacji](/pl/install/updating) i działaniami Discord. Automatyczna naprawa nigdy
nie obniża wersji nowszego Gateway ani nie zastępuje przypięcia kanału `extended-stable`.

Po udanej aktualizacji aplikacja znajduje ostatnio używaną przez człowieka
bezpośrednią sesję najwyższego poziomu i przekazuje temu agentowi jednorazowe zdarzenie aktualizacji. Aktywność Heartbeat
i Cron nie wpływa na ten wybór. Agent może następnie powitać ponownie
w najprawdopodobniej ostatnio używanej rozmowie. W trybie zdalnym aplikacja
aktualizuje tylko lokalne środowisko uruchomieniowe Node na Macu i pomija powiadomienie, gdy
zdalny Gateway jest starszy niż aplikacja.

Sparkle przestrzega ustawienia `update.channel` Gateway. Wartości `beta` i `dev` włączają
wersje beta aplikacji; `stable`, `extended-stable` oraz brakujące lub nieznane wartości
pozostawiają stabilne wersje aplikacji.

## Otwieranie linków na pulpicie

Kliknięcie zewnętrznego linku w osadzonym pulpicie aplikacji macOS otwiera go w bocznym panelu przeglądarki o regulowanej szerokości, domyślnie zajmującym połowę okna, przy zachowaniu widocznej nawigacji pulpitu. Przeciągnij separator, aby wybrać inną szerokość; aplikacja ją zapamięta. Każdy link otwiera się na osobnej karcie, pasek kart pojawia się po otwarciu wielu stron, a ponowne kliknięcie tego samego linku wykorzystuje istniejącą kartę. Przeciągaj karty, aby zmieniać ich kolejność, zamykaj je przyciskiem zamykania karty lub środkowym przyciskiem myszy, a także kliknij kartę prawym przyciskiem myszy, aby wybrać **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** lub **Close Other Tabs**. Przyciski wstecz/dalej na pasku tytułu okna oraz gesty na gładziku służą do poruszania się po historii pulpitu; własne przyciski wstecz/dalej panelu bocznego służą do poruszania się po historii aktywnej karty. Panel boczny zawiera również elementy sterujące ponownym ładowaniem, otwieraniem w domyślnej przeglądarce i zamykaniem.

Elementy sterujące na pasku tytułu dostosowują się do panelu bocznego aplikacji: gdy jest rozwinięty, przyciski wstecz/dalej znajdują się przy jego prawej krawędzi obok przełącznika panelu bocznego; gdy jest zwinięty, ustępują miejsca przyciskowi wyszukiwania (otwierającemu paletę poleceń) i przyciskowi nowej sesji.

Kliknij zewnętrzny link prawym przyciskiem myszy, aby wybrać **Open in Sidebar**, **Open in Default Browser** lub **Copy Link**. Kliknięcia z klawiszem modyfikującym i aktywowane przez użytkownika linki otwierające nowe okno z pulpitu nadal otwierają się w domyślnej przeglądarce; linki otwierające nowe okno wewnątrz panelu bocznego otwierają się jako nowe karty tego panelu. Zwykłe strony interfejsu Control UI hostowane w przeglądarce zachowują standardowe działanie linków i menu kontekstowego przeglądarki.

## Importowanie danych logowania z przeglądarki

Gdy panel boczny przeglądarki zostanie otwarty po raz pierwszy podczas działania aplikacji z lokalnym Gateway, pulpit wyświetli możliwy do odrzucenia baner, jeśli na Macu istnieje profil przeglądarki z rodziny Chrome zawierający pliki cookie. Baner umożliwia skopiowanie tych plików cookie do izolowanego, zarządzanego profilu używanego przez agentów do przeglądania. Wybierz profil za pomocą elementu **Import** (może być wymagany Touch ID); postęp i liczba zaimportowanych plików cookie pojawiają się w tym samym miejscu, a kopiowane są wyłącznie pliki cookie — hasła nigdy nie opuszczają przeglądarki źródłowej. Odrzucenie banera zapisuje ten wybór; ścieżka **Settings → General → Browser login → Import…** umożliwia ponowne wykonanie tej operacji w dowolnym momencie. Zobacz [Przeglądarkę](/pl/cli/browser), aby poznać bazowy proces importowania i warunek `browser.allowSystemProfileImport`.

## Wybór trybu Gateway

| Tryb   | Kiedy używać                                                                   | Strona szczegółowa                                  |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| Lokalny  | Ten Mac ma uruchamiać Gateway i utrzymywać go aktywnego za pomocą launchd.                | [Gateway w systemie macOS](/pl/platforms/mac/bundled-gateway) |
| Zdalny | Gateway działa na innym hoście; ten Mac steruje nim przez SSH, LAN lub Tailnet. | [Sterowanie zdalne](/pl/platforms/mac/remote)            |

Oba tryby wymagają zainstalowanego CLI `openclaw`, ponieważ aplikacja ponownie wykorzystuje jego środowisko uruchomieniowe
hosta Node. Na nowym Macu aplikacja automatycznie instaluje zgodne CLI; tryb lokalny
uruchamia następnie kreator Gateway, natomiast tryb zdalny łączy się z wybranym
Gateway bez uruchamiania drugiego lokalnego Gateway.
Instrukcje ręcznego odzyskiwania zawiera strona [Gateway w systemie macOS](/pl/platforms/mac/bundled-gateway).

## Elementy zarządzane przez aplikację

- Stan paska menu, powiadomienia, kondycja i WebChat.
- Monity o uprawnienia macOS dotyczące ekranu, mikrofonu, mowy, automatyzacji i dostępności.
- Jeden Node Maca, który łączy natywne funkcje Canvas, przechwytywanie obrazu z kamery/ekranu, powiadomienia,
  lokalizację i sterowanie komputerem z poleceniami systemowymi, przeglądarki,
  pluginów, umiejętności i MCP hosta Node CLI.
- Monity o zatwierdzanie wykonywania poleceń hostowanych na Macu.
- Wykonywanie zatwierdzonych poleceń powłoki w kontekście aplikacji, z zachowaniem przypisania
  uprawnień macOS do aplikacji, podczas gdy środowisko uruchomieniowe CLI zarządza współdzielonymi zasadami Node.
- Tunele SSH w trybie zdalnym lub bezpośrednie połączenia z Gateway.

Aplikacja **nie** zastępuje dokumentacji Gateway ani ogólnej dokumentacji CLI. Konfiguracja Gateway,
dostawcy, pluginy, kanały, narzędzia i zabezpieczenia mają własną
dokumentację.

## Szczegółowe strony dotyczące macOS

| Zadanie                                  | Dokumentacja                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Instalowanie lub debugowanie usługi CLI/Gateway | [Gateway w systemie macOS](/pl/platforms/mac/bundled-gateway)                                          |
| Przechowywanie stanu poza folderami synchronizowanymi z chmurą   | [Gateway w systemie macOS](/pl/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Debugowanie wykrywania aplikacji i łączności     | [Gateway w systemie macOS](/pl/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Zrozumienie działania launchd              | [Cykl życia Gateway](/pl/platforms/mac/child-process)                                           |
| Naprawianie problemów z uprawnieniami lub podpisywaniem/TCC    | [Uprawnienia macOS](/pl/platforms/mac/permissions)                                             |
| Wykrywanie ostatnio używanego Maca    | [Obecność aktywnego komputera](/pl/nodes/presence)                                                 |
| Łączenie ze zdalnym Gateway              | [Sterowanie zdalne](/pl/platforms/mac/remote)                                                     |
| Odczytywanie stanu paska menu i kontroli kondycji   | [Pasek menu](/pl/platforms/mac/menu-bar), [Kontrole kondycji](/pl/platforms/mac/health)                 |
| Korzystanie z osadzonego interfejsu czatu                 | [WebChat](/pl/platforms/mac/webchat)                                                           |
| Korzystanie z wybudzania głosowego lub funkcji „naciśnij, aby mówić”           | [Wybudzanie głosowe](/pl/platforms/mac/voicewake)                                                      |
| Korzystanie z Canvas i głębokich linków Canvas         | [Canvas](/pl/platforms/mac/canvas)                                                             |
| Hostowanie PeekabooBridge do automatyzacji interfejsu    | [Most Peekaboo](/pl/platforms/mac/peekaboo)                                                  |
| Konfigurowanie zatwierdzania poleceń              | [Zatwierdzanie wykonywania](/pl/tools/exec-approvals), [szczegóły zaawansowane](/pl/tools/exec-approvals-advanced) |
| Sprawdzanie poleceń Node Maca i IPC aplikacji    | [IPC systemu macOS](/pl/platforms/mac/xpc)                                                             |
| Przechwytywanie dzienników                         | [Rejestrowanie zdarzeń w macOS](/pl/platforms/mac/logging)                                                     |
| Kompilowanie ze źródeł                        | [Konfiguracja środowiska programistycznego macOS](/pl/platforms/mac/dev-setup)                                                 |

## Powiązane

- [Platformy](/pl/platforms)
- [Wprowadzenie](/pl/start/getting-started)
- [Gateway](/pl/gateway)
- [Zatwierdzanie wykonywania](/pl/tools/exec-approvals)
