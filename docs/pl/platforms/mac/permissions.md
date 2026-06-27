---
read_when:
    - Debugowanie brakujących lub zablokowanych monitów o uprawnienia macOS
    - Decydowanie, czy przyznać Accessibility procesowi node lub środowisku uruchomieniowemu CLI
    - Pakowanie lub podpisywanie aplikacji macOS
    - Zmiana identyfikatorów pakietów lub ścieżek instalacji aplikacji
summary: Utrzymywanie uprawnień macOS (TCC) i wymagania dotyczące podpisywania
title: Uprawnienia macOS
x-i18n:
    generated_at: "2026-06-27T17:48:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Uprawnienia macOS są kruche. TCC kojarzy nadane uprawnienie z podpisem kodu aplikacji, identyfikatorem pakietu i ścieżką na dysku. Jeśli którykolwiek z tych elementów się zmieni, macOS traktuje aplikację jako nową i może usunąć lub ukryć monity.

## Wymagania dotyczące stabilnych uprawnień

- Ta sama ścieżka: uruchamiaj aplikację ze stałej lokalizacji (w przypadku OpenClaw: `dist/OpenClaw.app`).
- Ten sam identyfikator pakietu: zmiana identyfikatora pakietu tworzy nową tożsamość uprawnień.
- Podpisana aplikacja: niepodpisane lub podpisane ad hoc kompilacje nie utrwalają uprawnień.
- Spójny podpis: użyj prawdziwego certyfikatu Apple Development lub Developer ID, aby podpis pozostawał stabilny między kolejnymi kompilacjami.

Podpisy ad hoc generują nową tożsamość przy każdej kompilacji. macOS zapomni poprzednie nadania, a monity mogą całkowicie zniknąć, dopóki nieaktualne wpisy nie zostaną wyczyszczone.

## Nadania Accessibility dla środowisk uruchomieniowych Node i CLI

Preferuj nadawanie Accessibility aplikacji OpenClaw.app, Peekaboo.app lub innemu podpisanemu narzędziu pomocniczemu z własnym identyfikatorem pakietu zamiast ogólnemu plikowi binarnemu `node`.

macOS TCC nadaje Accessibility tożsamości kodu procesu, który widzi. Jeśli przepływ pracy Homebrew, nvm, pnpm lub npm spowoduje, że współdzielony plik wykonywalny `node` otrzyma Accessibility, każdy pakiet JavaScript uruchomiony przez ten sam plik wykonywalny może odziedziczyć uprawnienia automatyzacji GUI.

Traktuj wpis `node` w Ustawieniach systemowych jako szerokie uprawnienie dla tego środowiska uruchomieniowego Node, a nie jako uprawnienie dla jednego pakietu npm. Unikaj nadawania Accessibility `node`, chyba że ufasz każdemu skryptowi i pakietowi uruchamianemu przez dokładnie tę instalację Node.

Jeśli przypadkowo nadano Accessibility `node`, usuń ten wpis z Ustawień systemowych -> Prywatność i bezpieczeństwo -> Accessibility. Następnie nadaj uprawnienie podpisanej aplikacji lub narzędziu pomocniczemu, które powinno odpowiadać za automatyzację UI.

## Lista kontrolna odzyskiwania, gdy monity znikną

1. Zamknij aplikację.
2. Usuń wpis aplikacji w Ustawieniach systemowych -> Prywatność i ochrona.
3. Uruchom aplikację ponownie z tej samej ścieżki i ponownie przyznaj uprawnienia.
4. Jeśli monit nadal się nie pojawia, zresetuj wpisy TCC za pomocą `tccutil` i spróbuj ponownie.
5. Niektóre uprawnienia pojawiają się ponownie dopiero po pełnym restarcie macOS.

Przykładowe resetowanie (w razie potrzeby zastąp identyfikator pakietu):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Uprawnienia do plików i folderów (Biurko/Dokumenty/Pobrane)

macOS może również ograniczać dostęp do Biurka, Dokumentów i Pobranych dla procesów terminalowych/w tle. Jeśli odczyt plików lub wyświetlanie zawartości katalogów się zawiesza, przyznaj dostęp temu samemu kontekstowi procesu, który wykonuje operacje na plikach (na przykład Terminal/iTerm, aplikacja uruchomiona przez LaunchAgent albo proces SSH).

Obejście: przenieś pliki do przestrzeni roboczej OpenClaw (`~/.openclaw/workspace`), jeśli chcesz uniknąć przyznawania uprawnień dla poszczególnych folderów.

Jeśli testujesz uprawnienia, zawsze podpisuj prawdziwym certyfikatem. Kompilacje ad hoc
są akceptowalne tylko do szybkich lokalnych uruchomień, w których uprawnienia nie mają znaczenia.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Podpisywanie macOS](/pl/platforms/mac/signing)
