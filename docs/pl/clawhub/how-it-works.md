---
read_when:
    - Zrozumienie wpisów, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowania i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:25:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw Skills i pluginów. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji oraz
zapewnia OpenClaw wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru z:

- właścicielem i slugiem lub nazwą pakietu
- jedną lub większą liczbą opublikowanych wersji
- metadanymi, podsumowaniem, plikami i atrybucją źródła
- dziennikiem zmian i informacjami o tagach, takimi jak `latest`
- sygnałami pobrania, instalacji, gwiazdki i komentarzy
- skanem bezpieczeństwa i statusem moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić, co dana Skills lub
plugin deklaruje, że robi, przed jej instalacją.

## Skills

Skills to wersjonowany pakiet tekstowy skoncentrowany wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter `SKILL.md`, aby zrozumieć nazwę Skills,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne
metadane są ważne, ponieważ pomagają użytkownikom zdecydować, czy zainstalować Skills, oraz
pomagają automatycznym skanom wykrywać rozbieżności między deklarowanym a zaobserwowanym zachowaniem.

Zobacz [Format Skills](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietu,
informacje o zgodności, linki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, sprawdza reklamowane metadane zgodności
przed instalacją. Rekordy pakietów mogą zawierać zgodność API,
minimalną wersję Gateway, docelowe hosty, wymagania środowiskowe i skróty
artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy rejestr ma być
źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy niezmienny rekord wersji. Wydawcy używają CLI `clawhub`
do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Użyj uruchomień próbnych, aby podejrzeć rozpoznany ładunek przed przesłaniem. Publiczne strony następnie
pokazują opublikowane metadane, pliki, atrybucję źródła i status skanu.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później rozpoznać ten sam
pakiet rejestru. CLI ClawHub obsługuje też bezpośrednie przepływy pracy instalacji i
aktualizacji Skills dla użytkowników, którzy chcą folderów Skills zarządzanych przez rejestr poza
pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom przesyłania,
automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Publiczne strony pokazują podsumowania skanów, gdy są dostępne. Treści wstrzymane, ukryte
lub zablokowane mogą zniknąć z publicznych przepływów wyszukiwania i instalacji, pozostając
widoczne dla właściciela na potrzeby diagnostyki lub odwołania.

Zobacz [Bezpieczeństwo + moderacja](/pl/clawhub/security) i
[Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp API

ClawHub udostępnia publiczne interfejsy API odczytu do odkrywania, wyszukiwania, szczegółów pakietów i
pobierania. Katalogi zewnętrzne mogą używać tych interfejsów API, gdy linkują z powrotem do
kanonicznej pozycji ClawHub, respektują limity szybkości i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).
