---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Kierowanie sesji do jednorazowych maszyn w chmurze: aprowizacja, środowisko uruchomieniowe procesów roboczych, wnioskowanie przez serwer proxy i strumieniowe przesyłanie wyników'
title: Procesy robocze w chmurze
x-i18n:
    generated_at: "2026-07-16T18:36:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Procesy robocze w chmurze umożliwiają uruchomienie pętli agenta sesji na jednorazowej maszynie w chmurze, podczas gdy wszystko, co dotyczy sesji, pozostaje tam, gdzie zawsze: jest widoczne na pasku bocznym i przesyłane strumieniowo na żywo, a transkrypcja należy do Gateway. Gateway dzierżawi maszynę, instaluje na niej przypiętą kopię OpenClaw, synchronizuje obszar roboczy sesji i przekazuje pętlę tury ograniczonemu procesowi `openclaw worker`. Wywołania modelu są przekazywane przez serwer proxy z powrotem do Gateway, więc dane uwierzytelniające dostawcy nigdy nie opuszczają maszyny użytkownika, a buforowanie promptów nadal działa, ponieważ dostawca widzi jeden ciągły strumień.

Po zakończeniu pracy (lub awarii maszyny) maszyna jest usuwana. Trwały stan — transkrypcja, commity obszaru roboczego i rekordy umiejscowienia — pozostaje przy Gateway.

<Note>
Procesy robocze w chmurze są opcjonalne i pozostają niewidoczne do czasu skonfigurowania profilu. W nieskonfigurowanych instalacjach nie pojawiają się żadne nowe RPC, ustawienia konfiguracji ani elementy interfejsu.
</Note>

## Co jest uruchamiane i gdzie

| Obszar                                                  | Lokalizacja                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Pętla agenta i narzędzia (`exec`, `read`, `write`, `edit`, …) | Maszyna procesu roboczego w chmurze                                               |
| Wnioskowanie modelu i dane uwierzytelniające dostawcy   | Gateway (przekazywane przez serwer proxy za pomocą odwołania `{provider, model}`) |
| Transkrypcja (trwały magazyn sesji)                     | Gateway                                                                          |
| Transmisja na żywo do paska bocznego                    | Dystrybucja Gateway zasilana odtwarzalnym strumieniem zdarzeń procesu roboczego  |
| Historia git obszaru roboczego                          | Tworzona na maszynie bez danych uwierzytelniających; Gateway przejmuje commity i odpowiada za wysyłanie zmian/PR |

Maszyna nie wymaga żadnych portów przychodzących poza `sshd`: Gateway nawiązuje połączenie wychodzące przez SSH z przypiętym kluczem, a tunel zwrotny przekazuje z powrotem WebSocket procesu roboczego. Dołączony dostawca Crabbox wymusza publiczną trasę SSH i wyłącza zarządzaną rejestrację w Tailscale. Dostęp wychodzący do internetu zależy od zasad dostawcy; domyślny profil AWS może uzyskiwać dostęp do internetu, chyba że zostanie to ograniczone w jego ustawieniach sieci lub grupie zabezpieczeń.

## Wymagania

- Plugin dostawcy procesów roboczych. Dołączony plugin `crabbox` steruje narzędziem CLI [Crabbox](https://github.com/openclaw/crabbox), które pośredniczy w dzierżawieniu zasobów u dostawców chmurowych (AWS, Hetzner i innych). Plik binarny `crabbox` musi znajdować się w `PATH` (lub należy ustawić `settings.binary`), a dane uwierzytelniające dostawcy muszą być już skonfigurowane. Dopuszczanie zasobów AWS wymaga Crabbox 0.38.1 lub nowszego.
- W przypadku procesów roboczych Crabbox AWS efektywna wartość `aws.instanceProfile` musi być pusta. Przed alokacją dostawca sprawdza `crabbox config show --json`, a następnie wymaga, aby `crabbox inspect --json` zgłaszało `providerMetadata.instanceProfileAttached: false` z EC2 `DescribeInstances`. Dzierżawy z rolą instancji lub bez autorytatywnych metadanych są zatrzymywane i odrzucane.
- Node.js na dzierżawionej maszynie. Podstawowe obrazy chmurowe zwykle go nie zawierają — należy zainstalować go w poleceniu `setup` profilu.
- Sesja z należącym do niej zarządzanym drzewem roboczym (można je utworzyć za pomocą `worktree: true`). Wysłanie zadania przenosi zawartość tego drzewa roboczego; zwykłe katalogi są synchronizowane jako lustrzana kopia manifestu.

## Konfiguracja

Dodaj profil w sekcji `cloudWorkers.profiles` pliku `openclaw.json`:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Pola profilu:

| Klucz      | Znaczenie                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | Identyfikator dostawcy procesów roboczych zarejestrowany przez plugin (`crabbox` w przypadku dołączonego pluginu).                                                                                                                             |
| `install`  | `bundle` (domyślnie) dostarcza kompilację uruchomionego Gateway; `npm` instaluje dokładną wydaną wersję Gateway z przypiętą sumą integralności. `npm` wymaga uruchamiania Gateway z wydania pakietowego.                        |
| `settings` | Kod JSON należący do dostawcy. W przypadku crabbox: `provider` (zaplecze), `class` (klasa maszyny), `ttl`, `idleTimeout` (czasy trwania Go), opcjonalne `setup` i bezwzględna ścieżka `binary`. OpenClaw wymusza publiczne SSH i wyłącza zarządzany Tailscale dla tych dzierżaw. |
| `lifetime` | Opcjonalnie zapisana zasada (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                            |

### Polecenie konfiguracji

`settings.setup` jest uruchamiane na dzierżawionej maszynie, gdy jest już gotowa do połączenia SSH, ale przed zainstalowaniem OpenClaw. Jest uruchamiane przy **każdej** próbie udostępnienia zasobów (w tym przy ponowieniach po przerwanym wysłaniu zadania), więc musi być idempotentne — instalacje należy zabezpieczyć testem `command -v`/`test -x`, jak w przykładzie. Jeśli konfiguracja się nie powiedzie, dostawca zatrzymuje dzierżawę, a wysłanie zadania kończy się bezpiecznie niepowodzeniem; żadna częściowo skonfigurowana maszyna nie pozostaje uruchomiona.

### Kanały instalacji

- **`bundle`** pakuje `dist` uruchomionego Gateway, okrojony plik `package.json` oraz wszystkie pakiety obszaru roboczego, do których odwołuje się kompilacja; całość jest objęta skrótem zawartości. Maszyna weryfikuje nienaruszony pakiet względem tego skrótu, a następnie instaluje produkcyjne zależności npm (z wyłączonymi skryptami). W ten sposób można uruchamiać kompilację deweloperską na procesie roboczym.
- **`npm`** potwierdza, że wydanie istnieje w publicznym rejestrze, przypina jego integralność SHA-512 i instaluje `openclaw@<version>` dokładnie zgodne z wersją Gateway.

## Wysyłanie sesji

W interfejsie sterowania otwórz **Nowa sesja**, wybierz agenta, którego skonfigurowanym środowiskiem uruchomieniowym jest OpenClaw, wybierz skonfigurowane miejsce docelowe **Chmura · profil** z menu **Gdzie**, a następnie rozpocznij zadanie. Wybranie chmury automatycznie włącza wymagane zarządzane drzewo robocze; Gateway tworzy sesję, kończy wysyłanie zadania i dopiero potem wysyła pierwszą turę. Plakietka serwera na pasku bocznym sesji pokazuje trwały stan umiejscowienia. Miejsca docelowe w chmurze nie są oferowane w zewnętrznych katalogach sesji CLI.

Odpowiadający temu przepływ RPC wygląda następująco:

Utwórz sesję z zarządzanym drzewem roboczym, a następnie ją wyślij (RPC wymaga `operator.admin` i istnieje tylko wtedy, gdy skonfigurowano profile):

Procesy robocze w chmurze uruchamiają środowisko uruchomieniowe agenta OpenClaw. Wybierz `openai/*` lub inny model, który jest rozpoznawany jako to środowisko uruchomieniowe; nie można wysyłać sesji skonfigurowanych do korzystania z zewnętrznego środowiska uruchomieniowego CLI, takiego jak `claude-cli`.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` zamyka lokalne przyjmowanie tur, oczekuje na zakończenie aktywnej pracy, udostępnia dzierżawę, uruchamia konfigurację, przygotowuje OpenClaw, synchronizuje obszar roboczy i kończy działanie, gdy umiejscowienie osiągnie własność procesu roboczego `active`. Na pierwsze wysłanie zadania należy przeznaczyć kilka minut; dzierżawy i instalacje są buforowane, jeśli dostawca to obsługuje. Następnie można korzystać z sesji jak zwykle — tury są automatycznie kierowane do procesu roboczego.

Po zakończeniu tur procesu roboczego kwalifikujące się pliki obszaru roboczego o ograniczonym rozmiarze są uzgadniane z powrotem z zarządzanym drzewem roboczym sesji przed zwolnieniem roszczenia do tury. Końcowe zdarzenie procesu roboczego tworzy trwałą barierę oczekującego wyniku przed potwierdzeniem odbioru, dzięki czemu po ponownym uruchomieniu Gateway zdalny obszar roboczy jest pobierany, zanim czyszczenie nieaktualnej tury zdoła zniszczyć jego właściciela. Uzgadnianie uwierzytelnia manifest procesu roboczego i zatrzymuje się w przypadku lokalnej rozbieżności, zamiast nadpisywać którąkolwiek ze stron. Przed zmianą plików Gateway zapisuje ograniczony dziennik wycofywania w swojej bazie danych stanu SQLite; ponowiona próba odtwarza ten dziennik po przerwaniu procesu Gateway. Wyniki obszaru roboczego korzystają z semantyki plików Git: zachowywane są zwykłe pliki, bity wykonywalności, dowiązania symboliczne, dodania, zmiany i usunięcia, natomiast puste katalogi i inne tryby katalogów nie są zachowywane. Zdalne obiekty commitów nie są zachowywane; wynikowe zmiany plików pozostają w zarządzanym drzewie roboczym do zwykłego przeglądu i zatwierdzenia.

Po zakończeniu pracy, gdy nie jest uruchomiona żadna tura, otwórz menu sesji i wybierz **Zatrzymaj proces roboczy w chmurze…**. Gateway wykonuje ostatnie uzgodnienie obszaru roboczego przed zniszczeniem środowiska. Umiejscowienie znajdujące się już w stanie `draining` lub `reconciling` kończy usuwanie; przed usunięciem sesji należy zaczekać, aż jego plakietka przyjmie stan `reclaimed`.

W przypadku uszkodzonego lub niekontrolowanego dołączonego procesu roboczego operator może w ostateczności wywołać `environments.destroy` z wartością `{ "force": true }`. Wymuszone usunięcie trwale oznacza umiejscowienie jako zakończone niepowodzeniem i porzuca wszelkie nieuzgodnione wyniki zdalne przed zniszczeniem środowiska.

Odpowiadające temu administracyjne RPC:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Umiejscowienie przechodzi przez trwałą maszynę stanów (`local → requested → provisioning → syncing → starting → active`), więc ponowne uruchomienie Gateway w trakcie wysyłania zadania powoduje uzgodnienie zamiast pozostawienia wyciekających maszyn. Nieudana tura modelu pozostawia aktywne umiejscowienie dostępne do ponowienia. Jeśli uzgadnianie przychodzącego obszaru roboczego się nie powiedzie, proces roboczy również pozostaje aktywny, aby operator mógł rozwiązać lokalny konflikt i ponowić próbę bez utraty wyniku zdalnego; awarie cyklu życia przenoszą natomiast umiejscowienie do stanu błędu lub odzyskania i zachowują końcową część diagnostyki.

## Model zabezpieczeń

- **Zamknięty ruch przychodzący procesu roboczego.** Procesy robocze komunikują się za pomocą dedykowanego protokołu przez tunelowane gniazdo z zamkniętą listą dozwolonych metod — proces roboczy nie może wywoływać RPC operatora.
- **Generowane dane uwierzytelniające, przechowywane jako skrót.** Każde wysłanie zadania generuje dane uwierzytelniające procesu roboczego; Gateway przechowuje tylko ich skrót. Rotacja danych uwierzytelniających i odgradzanie za pomocą epoki właściciela gwarantują najwyżej jednego aktywnego właściciela na sesję — nieaktualny proces roboczy, który ponownie się połączy, zostaje odgrodzony, a nigdy scalony.
- **Przypinanie klucza hosta.** Dostawca musi udostępnić klucz hosta SSH maszyny podczas przydzielania zasobów; proces przygotowania łączy się ze ścisłym przypięciem i bez niego kończy się bezpiecznie niepowodzeniem.
- **Brak stałych danych uwierzytelniających modelu, platformy repozytoriów ani chmury na maszynie.** Uwierzytelnianie modelu pozostaje w Gateway (wnioskowanie jest przesyłane za pomocą odwołania `{provider, model}`), commity git obszaru roboczego są tworzone bez danych uwierzytelniających platformy repozytoriów, a metadane dzierżawy Crabbox AWS są autorytatywnie sprawdzane pod kątem roli instancji przed konfiguracją. Polecenia konfiguracji również nie powinny zawierać danych uwierzytelniających.
- **Ruch wychodzący kontrolowany przez dostawcę.** Tunel zwrotny eliminuje potrzebę bezpośredniego dostępu OpenClaw do modelu, ale OpenClaw nie modyfikuje zapór dostawcy. Gdy zadanie tego wymaga, należy ograniczyć ruch wychodzący u dostawcy procesów roboczych.
- **Trwałe transkrypcje zapisywane dokładnie raz.** Proces roboczy zatwierdza partie transkrypcji za pomocą protokołu porównania i zamiany względem liścia sesji; nieaktualna baza powoduje bezpieczne zatrzymanie przebiegu zamiast zduplikowania lub zmiany bazy płatnych danych wyjściowych.

## Rozwiązywanie problemów

- **`sessions.dispatch` jest nieznaną metodą** — nie skonfigurowano żadnych `cloudWorkers.profiles` albo wywołujący nie ma `operator.admin`.
- **„Obroty pracownika w chmurze wymagają środowiska uruchomieniowego OpenClaw”** — wybierz model, którego skonfigurowanym środowiskiem uruchomieniowym jest OpenClaw. Zewnętrzne środowiska uruchomieniowe CLI, takie jak `claude-cli`, nie obsługują wnioskowania pracownika.
- **„Inicjalizacja pracownika wymaga Node.js na dzierżawionym hoście”** — dodaj instalację Node do `settings.setup` (patrz wyżej).
- **Atestacja roli instancji AWS kończy się niepowodzeniem** — wyczyść `aws.instanceProfile` (oraz `CRABBOX_AWS_INSTANCE_PROFILE`, jeśli jest ustawiona). Zainstaluj Crabbox 0.38.1 lub nowszy; starsze pliki binarne nie udostępniają wiążącego kontraktu `providerMetadata.instanceProfileAttached` wymaganego do dopuszczenia w AWS.
- **Wysyłanie zadania kończy się błędem dostawcy** — rekord rozmieszczenia i `environments.list` zachowują ostatni błąd, w tym końcowy fragment stderr konfiguracji/inicjalizacji. Maszyny są niszczone w razie niepowodzenia, dlatego ten fragment jest głównym źródłem danych do analizy.
- **Przekroczenie limitu czasu klienta podczas wysyłania zadania** — `openclaw gateway call` ma domyślnie limit czasu 10s; ustaw odpowiednio dużą wartość `--timeout` (wysyłanie i tak jest kontynuowane po stronie serwera, a ponowienie podczas przydzielania zasobów jest odrzucane z błędem `session cannot dispatch from placement provisioning`).
- **Zarządzanie dzierżawami** — `crabbox list --provider <backend>` pokazuje aktywne dzierżawy; `crabbox stop --provider <backend> --id <lease>` zwalnia ręcznie jedną z nich. Bezczynne dzierżawy wygasają zgodnie z wartością `idleTimeout` profilu.

## Powiązane

- [Izolacja](/pl/gateway/sandboxing) — ograniczanie zasięgu skutków lokalnego wykonywania narzędzi
- [CLI sesji](/pl/cli/sessions) — sprawdzanie zapisanych sesji
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
