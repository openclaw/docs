---
read_when:
    - Instalowanie aplikacji macOS
    - Wybór między lokalnym a zdalnym trybem Gateway w systemie macOS
    - Szukam plików do pobrania wydania aplikacji na macOS
summary: Zainstaluj i używaj aplikacji OpenClaw na pasku menu macOS
title: aplikacja macOS
x-i18n:
    generated_at: "2026-06-28T00:13:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

Aplikacja macOS jest **towarzyszem paska menu** OpenClaw. Użyj jej, gdy potrzebujesz
natywnego interfejsu zasobnika, monitów uprawnień macOS, powiadomień, WebChat, wejścia głosowego,
Canvas albo narzędzi Node hostowanych na Macu, takich jak `system.run`.

Jeśli potrzebujesz tylko CLI i Gateway, zacznij od [Pierwsze kroki](/pl/start/getting-started).

## Pobieranie

Pobierz kompilacje aplikacji macOS z
[wydań OpenClaw na GitHubie](https://github.com/openclaw/openclaw/releases).
Gdy wydanie zawiera zasoby aplikacji macOS, szukaj:

- `OpenClaw-<version>.dmg` (zalecane)
- `OpenClaw-<version>.zip`

Niektóre wydania zawierają tylko CLI, materiały dowodowe albo zasoby dla Windows. Jeśli najnowsze
wydanie nie ma zasobu aplikacji macOS, użyj najnowszego wydania, które go ma, albo zbuduj
aplikację ze źródeł, korzystając z [konfiguracji środowiska deweloperskiego macOS](/pl/platforms/mac/dev-setup).

## Pierwsze uruchomienie

1. Zainstaluj i uruchom **OpenClaw.app**.
2. Wykonaj listę kontrolną uprawnień macOS.
3. Wybierz tryb **Lokalny** albo **Zdalny**.
4. Zainstaluj CLI `openclaw`, jeśli aplikacja o to poprosi.
5. Otwórz WebChat z paska menu i wyślij wiadomość testową.

Dla ścieżki konfiguracji CLI/Gateway użyj [Pierwsze kroki](/pl/start/getting-started).
Aby przywrócić uprawnienia, użyj [uprawnień macOS](/pl/platforms/mac/permissions).

## Wybór trybu Gateway

| Tryb    | Kiedy go używać                                                                                      | Strona szczegółowa                                  |
| ------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Lokalny | Ten Mac powinien uruchamiać Gateway i utrzymywać go przy życiu za pomocą launchd.                    | [Gateway na macOS](/pl/platforms/mac/bundled-gateway)  |
| Zdalny  | Inny host uruchamia Gateway, a ten Mac powinien sterować nim przez SSH, LAN albo Tailnet.            | [Sterowanie zdalne](/pl/platforms/mac/remote)          |

Tryb lokalny wymaga zainstalowanego CLI `openclaw`. Aplikacja może je zainstalować albo możesz
postępować zgodnie z instrukcją [Gateway na macOS](/pl/platforms/mac/bundled-gateway).

## Za co odpowiada aplikacja

- Stan paska menu, powiadomienia, kondycja i WebChat.
- Monity uprawnień macOS dotyczące ekranu, mikrofonu, mowy, automatyzacji i dostępności.
- Lokalne narzędzia Node, takie jak Canvas, przechwytywanie z kamery/ekranu, powiadomienia i `system.run`.
- Monity zatwierdzania wykonywania dla poleceń hostowanych na Macu.
- Tunele SSH w trybie zdalnym albo bezpośrednie połączenia z Gateway.

Aplikacja **nie** zastępuje Gateway OpenClaw ani ogólnej dokumentacji CLI. Podstawowa
konfiguracja Gateway, dostawcy, plugins, kanały, narzędzia i zabezpieczenia są opisane w
osobnej dokumentacji.

## Strony szczegółowe macOS

| Zadanie                                      | Czytaj                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Zainstaluj lub debuguj usługę CLI/Gateway    | [Gateway na macOS](/pl/platforms/mac/bundled-gateway)                                                   |
| Trzymaj stan poza folderami synchronizowanymi z chmurą | [Gateway na macOS](/pl/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Debuguj wykrywanie aplikacji i łączność      | [Gateway na macOS](/pl/platforms/mac/bundled-gateway#debug-app-connectivity)                            |
| Zrozum zachowanie launchd                    | [Cykl życia Gateway](/pl/platforms/mac/child-process)                                                   |
| Napraw uprawnienia albo problemy z podpisywaniem/TCC | [uprawnienia macOS](/pl/platforms/mac/permissions)                                             |
| Połącz się ze zdalnym Gateway                | [Sterowanie zdalne](/pl/platforms/mac/remote)                                                           |
| Odczytaj stan paska menu i kontrole kondycji | [Pasek menu](/pl/platforms/mac/menu-bar), [Kontrole kondycji](/pl/platforms/mac/health)                    |
| Użyj wbudowanego interfejsu czatu            | [WebChat](/pl/platforms/mac/webchat)                                                                    |
| Użyj wybudzania głosem albo push-to-talk     | [Wybudzanie głosem](/pl/platforms/mac/voicewake)                                                        |
| Użyj Canvas i głębokich linków Canvas        | [Canvas](/pl/platforms/mac/canvas)                                                                      |
| Hostuj PeekabooBridge do automatyzacji UI    | [Most Peekaboo](/pl/platforms/mac/peekaboo)                                                             |
| Skonfiguruj zatwierdzanie poleceń            | [Zatwierdzanie wykonywania](/pl/tools/exec-approvals), [szczegóły zaawansowane](/pl/tools/exec-approvals-advanced) |
| Sprawdź polecenia Node na Macu i IPC aplikacji | [IPC macOS](/pl/platforms/mac/xpc)                                                                    |
| Przechwyć logi                               | [Logowanie macOS](/pl/platforms/mac/logging)                                                            |
| Zbuduj ze źródeł                             | [Konfiguracja środowiska deweloperskiego macOS](/pl/platforms/mac/dev-setup)                            |

## Powiązane

- [Platformy](/pl/platforms)
- [Pierwsze kroki](/pl/start/getting-started)
- [Gateway](/pl/gateway)
- [Zatwierdzanie wykonywania](/pl/tools/exec-approvals)
