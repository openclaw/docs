---
read_when:
    - Informacje o wpisach, wersjach, instalacjach, publikowaniu i moderacji
summary: Jak działają wpisy ClawHub, wersje, instalacje, publikowanie, skanowanie i aktualizacje.
x-i18n:
    generated_at: "2026-05-12T04:09:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw Skills i pluginów. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw dostarcza wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru z:

- właścicielem i slugiem albo nazwą pakietu
- jedną lub większą liczbą opublikowanych wersji
- metadanymi, podsumowaniem, plikami i atrybucją źródła
- dziennikiem zmian i informacjami o tagach, takimi jak `latest`
- sygnałami pobrań, instalacji, gwiazdek i komentarzy
- stanem skanowania bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić, co dana umiejętność lub
plugin deklaruje, że robi, zanim go zainstalują.

## Skills

Umiejętność to wersjonowany pakiet tekstowy skoncentrowany wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter `SKILL.md`, aby zrozumieć nazwę umiejętności,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne
metadane są ważne, ponieważ pomagają użytkownikom zdecydować, czy zainstalować umiejętność, oraz
pomagają automatycznym skanom wykrywać rozbieżności między deklarowanym a zaobserwowanym zachowaniem.

Zobacz [Format umiejętności](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietów,
informacje o zgodności, linki do źródeł, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, sprawdza deklarowane metadane zgodności
przed instalacją. Rekordy pakietów mogą zawierać zgodność API,
minimalną wersję Gateway, docelowe hosty, wymagania środowiskowe i skróty
artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był
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

Użyj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed przesłaniem. Publiczne strony następnie
pokazują opublikowane metadane, pliki, atrybucję źródła i stan skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietu:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby później aktualizacje mogły rozwiązać ten sam
pakiet rejestru. CLI ClawHub obsługuje również bezpośrednie przepływy pracy instalacji i
aktualizacji umiejętności dla użytkowników, którzy chcą folderów umiejętności zarządzanych przez rejestr poza
pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom przesyłania,
automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Publiczne strony pokazują podsumowania skanowania, gdy są dostępne. Treści wstrzymane, ukryte
lub zablokowane mogą zniknąć z publicznego wyszukiwania i przepływów instalacji, pozostając
widoczne dla właściciela na potrzeby diagnostyki.

Zobacz [Bezpieczeństwo i moderacja](/pl/clawhub/security) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API odczytu do odkrywania, wyszukiwania, szczegółów pakietów i
pobrań. Katalogi zewnętrzne mogą używać tych API, gdy odsyłają do
kanonicznej pozycji ClawHub, przestrzegają limitów szybkości i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).
