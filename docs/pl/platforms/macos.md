---
read_when:
    - Instalowanie aplikacji macOS
    - Wybór między lokalnym a zdalnym trybem Gateway w macOS
    - Szukanie pobrań wydań aplikacji macOS
summary: Zainstaluj i używaj aplikacji OpenClaw na pasku menu macOS
title: aplikacja macOS
x-i18n:
    generated_at: "2026-07-04T06:52:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

Aplikacja macOS to **towarzysz na pasku menu** OpenClaw. Użyj jej, gdy potrzebujesz
natywnego interfejsu w zasobniku, monitów uprawnień macOS, powiadomień, WebChat, wejścia głosowego,
Canvas lub narzędzi węzła hostowanych na Macu, takich jak `system.run`.

Jeśli potrzebujesz tylko CLI i Gateway, zacznij od [Pierwsze kroki](/pl/start/getting-started).

## Pobieranie

Pobierz kompilacje aplikacji macOS z
[wydań OpenClaw w GitHub](https://github.com/openclaw/openclaw/releases).
Gdy wydanie zawiera zasoby aplikacji macOS, szukaj:

- `OpenClaw-<version>.dmg` (preferowane)
- `OpenClaw-<version>.zip`

Niektóre wydania zawierają tylko CLI, materiały dowodowe lub zasoby Windows. Jeśli najnowsze
wydanie nie ma zasobu aplikacji macOS, użyj najnowszego wydania, które go ma, albo zbuduj
aplikację ze źródeł, korzystając z [konfiguracji deweloperskiej macOS](/pl/platforms/mac/dev-setup).

## Pierwsze uruchomienie

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Wybierz **Ten Mac** dla lokalnego Gateway albo połącz się ze zdalnym Gateway.
3. W trybie lokalnym poczekaj, aż aplikacja zainstaluje swoje środowisko uruchomieniowe w przestrzeni użytkownika i Gateway.
4. Ukończ konfigurację dostawcy oraz listę kontrolną uprawnień macOS.
5. Wyślij testową wiadomość wdrożeniową.

Dla ścieżki konfiguracji CLI/Gateway użyj [Pierwsze kroki](/pl/start/getting-started).
Aby odzyskać uprawnienia, użyj [uprawnień macOS](/pl/platforms/mac/permissions).

## Wybierz tryb Gateway

| Tryb   | Kiedy używać                                                                           | Strona szczegółów                                  |
| ------ | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lokalny  | Ten Mac powinien uruchamiać Gateway i utrzymywać go przy życiu za pomocą launchd.    | [Gateway w macOS](/pl/platforms/mac/bundled-gateway) |
| Zdalny | Inny host uruchamia Gateway, a ten Mac powinien sterować nim przez SSH, LAN lub Tailnet. | [Zdalne sterowanie](/pl/platforms/mac/remote)            |

Tryb lokalny wymaga zainstalowanego CLI `openclaw`. Na świeżym Macu aplikacja instaluje
pasujące CLI i środowisko uruchomieniowe automatycznie przed uruchomieniem kreatora Gateway.
Zobacz [Gateway w macOS](/pl/platforms/mac/bundled-gateway), aby uzyskać informacje o ręcznym odzyskiwaniu.

## Za co odpowiada aplikacja

- Stan paska menu, powiadomienia, kondycja i WebChat.
- Monity uprawnień macOS dla ekranu, mikrofonu, mowy, automatyzacji i ułatwień dostępu.
- Lokalne narzędzia węzła, takie jak Canvas, przechwytywanie kamery/ekranu, powiadomienia i `system.run`.
- Monity zatwierdzania wykonywania dla poleceń hostowanych na Macu.
- Tunele SSH w trybie zdalnym lub bezpośrednie połączenia z Gateway.

Aplikacja **nie** zastępuje dokumentacji OpenClaw Gateway ani ogólnej dokumentacji CLI. Podstawowa
konfiguracja Gateway, dostawcy, plugins, kanały, narzędzia i zabezpieczenia znajdują się w
osobnej dokumentacji.

## Strony szczegółów macOS

| Zadanie                                  | Przeczytaj                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Zainstaluj lub debuguj usługę CLI/Gateway | [Gateway w macOS](/pl/platforms/mac/bundled-gateway)                                          |
| Trzymaj stan poza folderami synchronizowanymi z chmurą | [Gateway w macOS](/pl/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Debuguj wykrywanie aplikacji i łączność  | [Gateway w macOS](/pl/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Zrozum zachowanie launchd                | [Cykl życia Gateway](/pl/platforms/mac/child-process)                                           |
| Napraw uprawnienia lub problemy z podpisywaniem/TCC | [uprawnienia macOS](/pl/platforms/mac/permissions)                                             |
| Połącz się ze zdalnym Gateway            | [Zdalne sterowanie](/pl/platforms/mac/remote)                                                     |
| Odczytaj stan paska menu i kontrole kondycji | [Pasek menu](/pl/platforms/mac/menu-bar), [Kontrole kondycji](/pl/platforms/mac/health)                 |
| Użyj wbudowanego interfejsu czatu        | [WebChat](/pl/platforms/mac/webchat)                                                           |
| Użyj wybudzania głosem lub push-to-talk  | [Wybudzanie głosem](/pl/platforms/mac/voicewake)                                                      |
| Użyj Canvas i deep linków Canvas         | [Canvas](/pl/platforms/mac/canvas)                                                             |
| Hostuj PeekabooBridge do automatyzacji UI | [Most Peekaboo](/pl/platforms/mac/peekaboo)                                                  |
| Skonfiguruj zatwierdzanie poleceń        | [Zatwierdzanie wykonywania](/pl/tools/exec-approvals), [szczegóły zaawansowane](/pl/tools/exec-approvals-advanced) |
| Sprawdź polecenia węzła Mac i IPC aplikacji | [IPC macOS](/pl/platforms/mac/xpc)                                                             |
| Przechwyć dzienniki                      | [Rejestrowanie macOS](/pl/platforms/mac/logging)                                                     |
| Zbuduj ze źródeł                         | [Konfiguracja deweloperska macOS](/pl/platforms/mac/dev-setup)                                                 |

## Powiązane

- [Platformy](/pl/platforms)
- [Pierwsze kroki](/pl/start/getting-started)
- [Gateway](/pl/gateway)
- [Zatwierdzanie wykonywania](/pl/tools/exec-approvals)
