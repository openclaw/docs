---
read_when:
    - Debugowanie brakujących lub zablokowanych monitów o uprawnienia w macOS
    - Podejmowanie decyzji o przyznaniu uprawnień Dostępności środowisku uruchomieniowemu Node lub CLI
    - Pakowanie lub podpisywanie aplikacji dla systemu macOS
    - Zmiana identyfikatorów pakietów lub ścieżek instalacji aplikacji
summary: Trwałość uprawnień systemu macOS (TCC) i wymagania dotyczące podpisywania
title: Uprawnienia systemu macOS
x-i18n:
    generated_at: "2026-07-12T15:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Uprawnienia przyznawane w macOS są nietrwałe. TCC wiąże przyznane uprawnienie z podpisem kodu aplikacji, identyfikatorem pakietu i ścieżką na dysku. Jeśli którykolwiek z tych elementów ulegnie zmianie, macOS traktuje aplikację jako nową i może usunąć lub ukryć monity.

## Wymagania dotyczące stabilnych uprawnień

- Ta sama ścieżka: uruchamiaj aplikację ze stałej lokalizacji (w przypadku OpenClaw: `dist/OpenClaw.app`).
- Ten sam identyfikator pakietu: identyfikator pakietu OpenClaw to `ai.openclaw.mac`; jego zmiana tworzy nową tożsamość uprawnień.
- Podpisana aplikacja: niepodpisane kompilacje lub kompilacje podpisane doraźnie nie zachowują uprawnień.
- Spójny podpis: używaj właściwego certyfikatu Apple Development lub Developer ID, aby podpis pozostawał stabilny między kolejnymi kompilacjami.

Podpisy doraźne generują nową tożsamość przy każdej kompilacji. macOS zapomina wcześniej przyznane uprawnienia, a monity mogą całkowicie zniknąć do czasu wyczyszczenia nieaktualnych wpisów.

## Uprawnienia dostępności dla środowisk uruchomieniowych Node i CLI

Zamiast ogólnemu plikowi binarnemu `node` lepiej przyznać uprawnienia dostępności aplikacji OpenClaw.app, Peekaboo.app lub innemu podpisanemu programowi pomocniczemu z własnym identyfikatorem pakietu.

TCC w macOS przyznaje uprawnienia dostępności tożsamości kodu widocznego procesu. Jeśli przepływ pracy Homebrew, nvm, pnpm lub npm spowoduje przyznanie uprawnień dostępności współdzielonemu plikowi wykonywalnemu `node`, każdy pakiet JavaScript uruchomiony za pomocą tego samego pliku wykonywalnego może odziedziczyć uprawnienia do automatyzacji interfejsu graficznego.

Traktuj wpis `node` w Ustawieniach systemowych jako szerokie uprawnienie dla danego środowiska uruchomieniowego Node, a nie jako uprawnienie dla pojedynczego pakietu npm. Nie przyznawaj uprawnień dostępności procesowi `node`, chyba że ufasz każdemu skryptowi i pakietowi uruchamianemu za pomocą dokładnie tej instalacji Node.

Jeśli przypadkowo przyznasz procesowi `node` uprawnienia dostępności, usuń ten wpis w System Settings -> Privacy & Security -> Accessibility. Następnie przyznaj je podpisanej aplikacji lub programowi pomocniczemu, który powinien odpowiadać za automatyzację interfejsu użytkownika.

## Lista kontrolna odzyskiwania, gdy monity znikną

1. Zamknij aplikację.
2. Usuń wpis aplikacji w System Settings -> Privacy & Security.
3. Uruchom ponownie aplikację z tej samej ścieżki i ponownie przyznaj uprawnienia.
4. Jeśli monit nadal się nie pojawia, zresetuj wpisy TCC za pomocą `tccutil` i spróbuj ponownie.
5. Niektóre uprawnienia pojawiają się ponownie dopiero po pełnym ponownym uruchomieniu macOS.

Przykładowe polecenia resetowania (z użyciem identyfikatora pakietu OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Uprawnienia do plików i folderów (Biurko/Dokumenty/Pobrane)

macOS może również ograniczać procesom terminalowym i działającym w tle dostęp do folderów Biurko, Dokumenty i Pobrane. Jeśli odczytywanie plików lub wyświetlanie zawartości katalogów się zawiesza, przyznaj dostęp temu samemu kontekstowi procesu, który wykonuje operacje na plikach (na przykład Terminalowi/iTermowi, aplikacji uruchamianej przez LaunchAgent lub procesowi SSH).

Obejście: przenieś pliki do przestrzeni roboczej OpenClaw (`~/.openclaw/workspace`), jeśli chcesz uniknąć przyznawania uprawnień osobno dla poszczególnych folderów.

Podczas testowania uprawnień zawsze podpisuj aplikację właściwym certyfikatem. Kompilacje podpisane doraźnie są dopuszczalne tylko do szybkich uruchomień lokalnych, w których uprawnienia nie mają znaczenia.

## Powiązane

- [Aplikacja dla macOS](/pl/platforms/macos)
- [Podpisywanie aplikacji dla macOS](/pl/platforms/mac/signing)
