---
read_when:
    - Publikowanie umiejętności lub Plugin
    - Debugowanie błędów właściciela lub zakresu pakietu
    - Dodawanie zachowania publikowania w UI, CLI lub backendzie
summary: Jak działa publikowanie w ClawHub dla Skills, pluginów, właścicieli, zakresów, wydań i weryfikacji.
x-i18n:
    generated_at: "2026-06-27T17:17:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publikowanie

Publikowanie wysyła folder Skills lub pakiet pluginu do ClawHub pod wybranym
właścicielem. ClawHub sprawdza, czy Twój token może publikować dla tego
właściciela, weryfikuje metadane, nazwę, wersję, pliki i informacje o źródle,
a następnie zapisuje wydanie i uruchamia automatyczne kontrole bezpieczeństwa.

Jeśli walidacja się nie powiedzie, nic nie zostanie opublikowane. Nowe wydania
mogą też pozostać niedostępne w standardowych miejscach instalacji i pobierania,
dopóki przegląd się nie zakończy.

## Skills

Najprostszą ścieżką publikowania jest CLI. Zaloguj się, a następnie opublikuj
lokalny folder Skills:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Użyj `--owner <handle>` podczas publikowania jako właściciel organizacji. Pomiń
ten argument, aby publikować jako uwierzytelniony użytkownik. Publikowanie
pomija niezmienioną zawartość. Nowe Skills zaczyna od wersji `1.0.0`, a późniejsze
zmiany automatycznie publikują kolejną wersję poprawkową. Przekaż `--version`
tylko wtedy, gdy potrzebujesz jawnej wersji.

W przypadku repozytoriów katalogu użyj wielokrotnego użytku workflow
[`skill-publish.yml` ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Wywołuje on `skill publish` dla każdego bezpośredniego folderu Skills pod
`root` (domyślnie: `skills`) albo tylko dla folderu podanego jako `skill_path`.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Użyj `dry_run: true`, aby podejrzeć nowe i zmienione Skills bez publikowania.

## Pluginy

Pluginy używają nazw pakietów w stylu npm. Nazwy pakietów z zakresem zawierają
właściciela w pierwszej części nazwy:

```text
@owner/package-name
```

Zakres musi pasować do wybranego właściciela publikacji. Jeśli Twój pakiet nosi
nazwę `@openclaw/dronzer`, może zostać opublikowany tylko jako `@openclaw`.
Jeśli publikujesz jako `@vintageayu`, zmień nazwę pakietu na
`@vintageayu/dronzer`.

Zapobiega to sytuacji, w której pakiet rości sobie prawo do przestrzeni nazw
organizacji, której publikujący nie kontroluje.

Jeśli jesteś prawowitym właścicielem organizacji, marki, zakresu pakietu,
uchwytu właściciela lub przestrzeni nazw, która jest już zajęta albo
zarezerwowana w ClawHub, otwórz
[zgłoszenie roszczenia organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
z publicznym, niewrażliwym dowodem. Zobacz
[Roszczenia organizacji i przestrzeni nazw](/pl/clawhub/namespace-claims), aby
sprawdzić, co dołączyć, a czego nie umieszczać w publicznych zgłoszeniach.

### Przed opublikowaniem pluginu

- Wybierz właściciela pasującego do zakresu pakietu.
- Dołącz `openclaw.plugin.json`. Pluginy kodowe potrzebują też `package.json` z
  `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.
- Aby pokazać niestandardową ikonę karty pluginu, dodaj `icon` do
  `openclaw.plugin.json` z dowolnym adresem URL obrazu HTTPS.
- Dołącz repozytorium źródłowe i metadane dokładnego commita albo użyj CLI z
  checkoutu opartego na GitHub, aby mogło je wykryć.
- Uruchom `clawhub package validate <source>` przed publikacją. W przypadku
  ustaleń dotyczących pakietu, manifestu, importu SDK lub artefaktu zobacz
  [Poprawki walidacji pluginów](/pl/clawhub/plugin-validation-fixes).
- Uruchom `clawhub package publish <source> --dry-run` przed utworzeniem wydania.
- Spodziewaj się, że nowe wydania pozostaną poza publicznymi miejscami
  instalacji, dopóki nie zakończą się automatyczne kontrole bezpieczeństwa i
  weryfikacja.

### Zaufane publikowanie pakietów

Zaufane publikowanie pakietu wymaga dwuetapowej konfiguracji:

1. Opublikuj pakiet raz przez standardowe ręczne lub uwierzytelnione tokenem
   `clawhub package publish`. Tworzy to wiersz pakietu i ustanawia menedżerów
   pakietu, którzy mogą zmieniać jego konfigurację zaufanego publikującego.
2. Menedżer pakietu ustawia konfigurację zaufanego publikującego GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Po ustawieniu konfiguracji przyszłe obsługiwane publikacje GitHub Actions mogą
używać OIDC/zaufanego publikowania bez przechowywania długotrwałego tokena
ClawHub w repozytorium. Skonfigurowane repozytorium i nazwa pliku workflow muszą
pasować do roszczenia OIDC GitHub Actions. Jeśli przekażesz też
`--environment <name>`, roszczenie środowiska GitHub Actions musi dokładnie
pasować do tej nazwy.

ClawHub weryfikuje skonfigurowane repozytorium GitHub podczas ustawiania
konfiguracji zaufanego publikującego. Repozytoria publiczne można zweryfikować
przez publiczne metadane GitHub. Repozytoria prywatne wymagają, aby ClawHub miał
dostęp GitHub do tego repozytorium, na przykład przez przyszłą instalację ClawHub
GitHub App lub inną autoryzowaną integrację GitHub.

Obecny workflow publikowania pakietów wielokrotnego użytku obsługuje zaufane
publikowanie bez sekretów dla publikacji `workflow_dispatch`, gdy dostępne jest
`id-token: write`. Rzeczywiste publikacje z wypchnięcia tagu nadal potrzebują
`clawhub_token`, więc zachowaj `CLAWHUB_TOKEN` dla wydań tagów, pierwszych
publikacji, niezaufanych pakietów lub publikacji awaryjnych.

Sprawdź lub usuń konfigurację za pomocą:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Usunięcie konfiguracji zaufanego publikującego jest ścieżką wycofania. Wyłącza
przyszłe wystawianie tokenów zaufanego publikowania, dopóki menedżer pakietu nie
ustawi konfiguracji ponownie.

## Najczęstsze pytania

### Zakres pakietu musi pasować do wybranego właściciela

Jeśli zakres pakietu i wybrany właściciel nie pasują do siebie, ClawHub odrzuca
publikację:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Aby to naprawić, wybierz właściciela wskazanego przez zakres pakietu albo zmień
nazwę pakietu tak, aby zakres pasował do właściciela, jako którego możesz
publikować.

Jeśli nazwa pakietu ma już właściwy zakres, ale pakiet należy do niewłaściwego
publikującego, zamiast tego przenieś własność:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Używaj przenoszenia pakietu lub Skills tylko wtedy, gdy masz dostęp
administracyjny zarówno do bieżącego właściciela, jak i do docelowego
publikującego. Przeniesienie pakietu nie pozwala publikować w zakresie, którym
nie możesz zarządzać.

Jeśli nie masz dostępu do bieżącego właściciela, ale uważasz, że Twoja
organizacja, projekt lub marka jest prawowitym właścicielem przestrzeni nazw,
otwórz
[zgłoszenie roszczenia organizacji / przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
z publicznym, niewrażliwym dowodem do przeglądu przez zespół. Przed zgłoszeniem
zobacz [Roszczenia organizacji i przestrzeni nazw](/pl/clawhub/namespace-claims).

Chroni to przestrzenie nazw organizacji. Pakiet o nazwie `@openclaw/dronzer`
rości sobie prawo do przestrzeni nazw `@openclaw`, więc tylko publikujący z
dostępem do właściciela `@openclaw` mogą go opublikować.
