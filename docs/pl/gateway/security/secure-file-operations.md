---
read_when:
    - Zmiana dostępu do plików, wyodrębniania archiwów, przechowywania obszaru roboczego lub pomocników systemu plików Pluginu
summary: Jak OpenClaw bezpiecznie obsługuje dostęp do plików lokalnych i dlaczego opcjonalny pomocnik fs-safe napisany w Pythonie jest domyślnie wyłączony
title: Bezpieczne operacje na plikach
x-i18n:
    generated_at: "2026-05-06T09:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw używa [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) do wrażliwych bezpieczeństwowo lokalnych operacji na plikach: odczytów/zapisów ograniczonych do katalogu głównego, atomowego zastępowania, rozpakowywania archiwów, tymczasowych obszarów roboczych, stanu JSON i obsługi plików z sekretami.

Celem jest spójna **bariera biblioteczna** dla zaufanego kodu OpenClaw, który otrzymuje niezaufane nazwy ścieżek. To nie jest piaskownica. Uprawnienia systemu plików hosta, użytkownicy systemu operacyjnego, kontenery oraz polityka agenta/narzędzi nadal definiują rzeczywisty promień oddziaływania.

## Domyślnie: bez pomocnika Python

OpenClaw domyślnie ustawia pomocnika fs-safe POSIX Python na **wyłączony**.

Dlaczego:

- gateway nie powinien uruchamiać trwałego procesu pomocniczego Python, chyba że operator świadomie to włączył;
- wiele instalacji nie potrzebuje dodatkowego wzmocnienia przed mutacjami katalogów nadrzędnych;
- wyłączenie Python sprawia, że zachowanie pakietu/środowiska uruchomieniowego jest bardziej przewidywalne w środowiskach desktopowych, Docker, CI i aplikacji pakietowych.

OpenClaw zmienia tylko wartość domyślną. Jeśli jawnie ustawisz tryb, fs-safe go respektuje:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Ogólne nazwy fs-safe również działają: `FS_SAFE_PYTHON_MODE` i `FS_SAFE_PYTHON`.

## Co pozostaje chronione bez Python

Gdy pomocnik jest wyłączony, OpenClaw nadal używa ścieżek Node z fs-safe do:

- odrzucania ucieczek przez ścieżki względne, takich jak `..`, ścieżek bezwzględnych oraz separatorów ścieżek tam, gdzie dozwolone są tylko nazwy;
- rozwiązywania operacji przez zaufany uchwyt katalogu głównego zamiast doraźnych sprawdzeń `path.resolve(...).startsWith(...)`;
- odmawiania wzorców dowiązań symbolicznych i twardych w API, które wymagają takiej polityki;
- otwierania plików ze sprawdzeniami tożsamości tam, gdzie API zwraca lub przyjmuje zawartość pliku;
- atomowych zapisów przez tymczasowy plik równorzędny dla plików stanu/konfiguracji;
- limitów bajtów dla odczytów i rozpakowywania archiwów;
- trybów prywatnych dla sekretów i plików stanu tam, gdzie API ich wymaga.

Te zabezpieczenia obejmują normalny model zagrożeń OpenClaw: zaufany kod gateway obsługujący niezaufane dane wejściowe ścieżek z modelu/pluginu/kanału w obrębie jednej zaufanej granicy operatora.

## Co dodaje Python

Na POSIX opcjonalny pomocnik fs-safe utrzymuje jeden trwały proces Python i używa operacji systemu plików względnych wobec deskryptora pliku dla mutacji katalogów nadrzędnych, takich jak zmiana nazwy, usuwanie, mkdir, stat/list oraz niektóre ścieżki zapisu.

Zawęża to okna wyścigów w obrębie tego samego UID, w których inny proces może podmienić katalog nadrzędny między walidacją a mutacją. Jest to obrona warstwowa dla hostów, na których niezaufane lokalne procesy mogą modyfikować te same katalogi, w których działa OpenClaw.

Jeśli Twoje wdrożenie ma takie ryzyko i Python na pewno jest dostępny, użyj:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Użyj `require` zamiast `auto`, gdy pomocnik jest częścią Twojej postawy bezpieczeństwa; `auto` celowo wraca do zachowania opartego tylko na Node, jeśli pomocnik jest niedostępny.

## Wskazówki dla Plugin i core

- Dostęp do plików widoczny dla Plugin powinien przechodzić przez pomocniki `openclaw/plugin-sdk/*`, a nie surowe `fs`, gdy ścieżka pochodzi z wiadomości, wyjścia modelu, konfiguracji lub danych wejściowych pluginu.
- Kod core powinien używać lokalnych wrapperów fs-safe w `src/infra/*`, aby polityka procesu OpenClaw była stosowana spójnie.
- Rozpakowywanie archiwów powinno używać pomocników archiwów fs-safe z jawnymi limitami rozmiaru, liczby wpisów, dowiązań i miejsca docelowego.
- Sekrety powinny używać pomocników sekretów OpenClaw albo pomocników sekretów/stanu prywatnego fs-safe; nie implementuj ręcznie sprawdzeń trybu wokół `fs.writeFile`.
- Jeśli potrzebujesz izolacji przed wrogim lokalnym użytkownikiem, nie polegaj wyłącznie na fs-safe. Uruchamiaj osobne Gateway pod osobnymi użytkownikami/hostami systemu operacyjnego albo użyj sandboxingu.

Powiązane: [Bezpieczeństwo](/pl/gateway/security), [Sandboxing](/pl/gateway/sandboxing), [Zatwierdzenia exec](/pl/tools/exec-approvals), [Sekrety](/pl/gateway/secrets).
