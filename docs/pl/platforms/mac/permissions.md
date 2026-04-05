---
read_when:
    - Debugujesz brakujące lub zawieszone monity o uprawnienia macOS
    - Pakujesz albo podpisujesz aplikację macOS
    - Zmieniasz bundle ID albo ścieżki instalacji aplikacji
summary: Trwałość uprawnień macOS (TCC) i wymagania dotyczące podpisywania
title: Uprawnienia macOS
x-i18n:
    generated_at: "2026-04-05T13:59:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# Uprawnienia macOS (TCC)

Nadania uprawnień w macOS są kruche. TCC wiąże przyznane uprawnienie z
podpisem kodu aplikacji, identyfikatorem pakietu i ścieżką na dysku. Jeśli którekolwiek z nich się zmieni,
macOS traktuje aplikację jako nową i może usunąć albo ukryć monity.

## Wymagania dla stabilnych uprawnień

- Ta sama ścieżka: uruchamiaj aplikację z ustalonej lokalizacji (dla OpenClaw jest to `dist/OpenClaw.app`).
- Ten sam identyfikator pakietu: zmiana bundle ID tworzy nową tożsamość uprawnień.
- Podpisana aplikacja: buildy niepodpisane lub podpisane ad-hoc nie zachowują uprawnień.
- Spójny podpis: używaj prawdziwego certyfikatu Apple Development albo Developer ID,
  aby podpis pozostawał stabilny między kolejnymi buildami.

Podpisy ad-hoc generują nową tożsamość przy każdej kompilacji. macOS zapomina wtedy wcześniejsze
zgody, a monity mogą całkowicie zniknąć, dopóki stare wpisy nie zostaną wyczyszczone.

## Checklista odzyskiwania, gdy monity znikają

1. Zamknij aplikację.
2. Usuń wpis aplikacji w Ustawienia systemowe -> Prywatność i bezpieczeństwo.
3. Uruchom ponownie aplikację z tej samej ścieżki i ponownie przyznaj uprawnienia.
4. Jeśli monit nadal się nie pojawia, zresetuj wpisy TCC przez `tccutil` i spróbuj ponownie.
5. Niektóre uprawnienia pojawiają się ponownie dopiero po pełnym restarcie macOS.

Przykładowe resetowanie (w razie potrzeby podmień bundle ID):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Uprawnienia do plików i folderów (Desktop/Documents/Downloads)

macOS może także ograniczać dostęp do Desktop, Documents i Downloads dla procesów terminalowych/działających w tle. Jeśli odczyty plików lub listowanie katalogów zawieszają się, przyznaj dostęp temu samemu kontekstowi procesu, który wykonuje operacje na plikach (na przykład Terminal/iTerm, aplikacja uruchomiona przez LaunchAgent albo proces SSH).

Obejście problemu: przenieś pliki do workspace OpenClaw (`~/.openclaw/workspace`), jeśli chcesz uniknąć przyznawania uprawnień per folder.

Jeśli testujesz uprawnienia, zawsze podpisuj aplikację prawdziwym certyfikatem. Buildy ad-hoc
są akceptowalne tylko do szybkich lokalnych uruchomień, w których uprawnienia nie mają znaczenia.
