---
read_when:
    - Publikowanie Skills lub pluginu
    - Debugowanie błędów właściciela lub zakresu pakietu
    - Dodawanie funkcji publikowania w interfejsie użytkownika, CLI lub zapleczu
summary: Jak działa publikowanie w ClawHub w przypadku umiejętności, pluginów, właścicieli, zakresów, wydań i recenzji.
x-i18n:
    generated_at: "2026-07-12T14:56:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publikowanie

Publikowanie przesyła folder umiejętności lub pakiet Pluginu do ClawHub w ramach wybranego właściciela. ClawHub sprawdza, czy Twój token umożliwia publikowanie w jego imieniu, weryfikuje metadane, nazwę, wersję, pliki oraz informacje o źródle, a następnie zapisuje wydanie i uruchamia automatyczne kontrole bezpieczeństwa.

Jeśli walidacja się nie powiedzie, nic nie zostanie opublikowane. Nowe wydania mogą również pozostać niedostępne w standardowych interfejsach instalowania i pobierania do czasu zakończenia przeglądu.

## Skills

Najprostszym sposobem publikowania jest użycie CLI. Zaloguj się, a następnie opublikuj lokalny folder umiejętności:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Użyj `--owner <handle>` podczas publikowania w imieniu organizacji. Pomiń tę opcję, aby publikować jako uwierzytelniony użytkownik. Podczas publikowania niezmieniona zawartość jest pomijana. Nowa umiejętność otrzymuje początkową wersję `1.0.0`, a późniejsze zmiany automatycznie publikują kolejną wersję poprawkową. Przekazuj `--version` tylko wtedy, gdy potrzebujesz jawnie określonej wersji.

W przypadku repozytoriów katalogowych użyj wielokrotnego użytku
[przepływu pracy `skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) z ClawHub.
Wywołuje on `skill publish` dla każdego bezpośredniego folderu umiejętności w katalogu `root` (domyślnie:
`skills`) albo tylko dla folderu przekazanego jako `skill_path`.

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

Użyj `dry_run: true`, aby wyświetlić podgląd nowych i zmienionych umiejętności bez ich publikowania.

## Pluginy

Pluginy używają nazw pakietów w stylu npm. Nazwy pakietów z zakresem zawierają właściciela w pierwszej części nazwy:

```text
@owner/package-name
```

Zakres musi odpowiadać wybranemu właścicielowi publikacji. Jeśli Twój pakiet ma nazwę `@openclaw/dronzer`, można go opublikować wyłącznie jako `@openclaw`. Jeśli publikujesz jako `@vintageayu`, zmień nazwę pakietu na `@vintageayu/dronzer`.

Zapobiega to przejmowaniu przez pakiet przestrzeni nazw organizacji, nad którą publikujący nie ma kontroli.

Jeśli jesteś prawowitym właścicielem organizacji, marki, zakresu pakietów, identyfikatora właściciela lub przestrzeni nazw, która jest już zajęta albo zastrzeżona w ClawHub, utwórz
[zgłoszenie roszczenia do organizacji lub przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml),
dołączając publiczne, niewrażliwe dowody. Informacje o tym, co należy dołączyć, a czego nie umieszczać w publicznych zgłoszeniach, znajdziesz w sekcji
[Roszczenia do organizacji i przestrzeni nazw](/clawhub/namespace-claims).

### Przed opublikowaniem Pluginu

- Wybierz właściciela odpowiadającego zakresowi pakietu.
- Dołącz plik `openclaw.plugin.json`. Pluginy zawierające kod wymagają również pliku `package.json` z polami
  `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.
- Aby wyświetlić niestandardową ikonę karty Pluginu, dodaj pole `icon` do pliku `openclaw.plugin.json` z dowolnym adresem URL obrazu HTTPS.
- Dołącz repozytorium źródłowe i metadane dokładnego commitu albo użyj CLI w kopii roboczej opartej na GitHubie, aby umożliwić ich automatyczne wykrycie.
- Przed publikowaniem uruchom `clawhub package validate <source>`. Rozwiązania problemów dotyczących pakietu, manifestu, importów SDK lub artefaktów znajdziesz w sekcji
  [Poprawki błędów walidacji Pluginu](/clawhub/plugin-validation-fixes).
- Przed utworzeniem wydania uruchom `clawhub package publish <source> --dry-run`.
- Należy się spodziewać, że nowe wydania pozostaną niedostępne w publicznych interfejsach instalowania do czasu zakończenia automatycznych kontroli bezpieczeństwa i weryfikacji.

### Zaufane publikowanie pakietów

Konfiguracja zaufanego publikowania pakietów składa się z dwóch etapów:

1. Opublikuj pakiet po raz pierwszy przy użyciu standardowego, ręcznego polecenia `clawhub package publish` lub tego polecenia z uwierzytelnianiem tokenem. Spowoduje to utworzenie rekordu pakietu i określenie menedżerów pakietu, którzy mogą zmieniać konfigurację jego zaufanego publikującego.
2. Menedżer pakietu ustawia konfigurację zaufanego publikującego dla GitHub Actions:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Po ustawieniu konfiguracji przyszłe obsługiwane publikacje z GitHub Actions mogą korzystać z OIDC i zaufanego publikowania bez przechowywania długoterminowego tokenu ClawHub w repozytorium. Skonfigurowane repozytorium i nazwa pliku przepływu pracy muszą odpowiadać deklaracji OIDC z GitHub Actions. Jeśli przekażesz również `--environment <name>`, deklaracja środowiska GitHub Actions musi dokładnie odpowiadać tej nazwie.

ClawHub weryfikuje skonfigurowane repozytorium GitHub podczas ustawiania konfiguracji zaufanego publikującego. Repozytoria publiczne można zweryfikować za pomocą publicznych metadanych GitHuba. Repozytoria prywatne wymagają, aby ClawHub miał dostęp do danego repozytorium w GitHubie, na przykład poprzez przyszłą instalację aplikacji ClawHub GitHub App lub inną autoryzowaną integrację z GitHubem.

Obecny przepływ pracy wielokrotnego użytku do publikowania pakietów obsługuje zaufane publikowanie bez użycia sekretów dla publikacji `workflow_dispatch`, gdy dostępne jest uprawnienie `id-token: write`. Rzeczywiste publikacje uruchamiane przez wypchnięcie tagu nadal wymagają `clawhub_token`, dlatego zachowaj dostępność `CLAWHUB_TOKEN` na potrzeby wydań tagowanych, pierwszych publikacji, niezaufanych pakietów lub awaryjnych publikacji.

Sprawdź lub usuń konfigurację za pomocą:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Usunięcie konfiguracji zaufanego publikującego jest sposobem wycofania zmian. Wyłącza ono generowanie tokenów dla przyszłych zaufanych publikacji do czasu ponownego ustawienia konfiguracji przez menedżera pakietu.

## Często zadawane pytania

### Zakres pakietu musi odpowiadać wybranemu właścicielowi

Jeśli zakres pakietu i wybrany właściciel nie są zgodne, ClawHub odrzuca publikację:

```text
Zakres pakietu „@openclaw” musi odpowiadać wybranemu właścicielowi „@vintageayu”.
Opublikuj jako „@openclaw” lub zmień nazwę tego pakietu na „@vintageayu/dronzer”.
```

Aby rozwiązać ten problem, wybierz właściciela wskazanego w zakresie pakietu albo zmień nazwę pakietu tak, aby zakres odpowiadał właścicielowi, w którego imieniu możesz publikować.

Jeśli nazwa pakietu ma już prawidłowy zakres, ale pakiet należy do niewłaściwego publikującego, zamiast tego przenieś własność:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Przenoszenie pakietu lub umiejętności jest możliwe tylko wtedy, gdy masz dostęp administracyjny zarówno do obecnego właściciela, jak i docelowego publikującego. Przeniesienie pakietu nie umożliwia publikowania w zakresie, którym nie możesz zarządzać.

Jeśli nie masz dostępu do obecnego właściciela, ale uważasz, że Twoja organizacja, projekt lub marka jest prawowitym właścicielem przestrzeni nazw, utwórz
[zgłoszenie roszczenia do organizacji lub przestrzeni nazw](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml),
dołączając publiczne, niewrażliwe dowody do weryfikacji przez zespół. Przed przesłaniem zgłoszenia zapoznaj się z sekcją
[Roszczenia do organizacji i przestrzeni nazw](/clawhub/namespace-claims).

Chroni to przestrzenie nazw organizacji. Pakiet o nazwie `@openclaw/dronzer` zajmuje przestrzeń nazw `@openclaw`, dlatego może go publikować wyłącznie publikujący mający dostęp do właściciela `@openclaw`.
