---
read_when:
    - Informacje o wpisach, wersjach, instalacjach, publikowaniu i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowania i aktualizacje ClawHub.
x-i18n:
    generated_at: "2026-07-01T08:33:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw Skills i pluginów. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja jest rekordem rejestru z:

- właścicielem oraz slugiem lub nazwą pakietu
- jedną lub większą liczbą opublikowanych wersji
- metadanymi, podsumowaniem, plikami i atrybucją źródła
- dziennikiem zmian i informacjami o tagach, takimi jak `latest`
- sygnałami pobrań, instalacji i gwiazdek
- statusem skanowania bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co skill lub plugin deklaruje, że robi, zanim go zainstalują.

## Skills

Skill to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter `SKILL.md`, aby zrozumieć nazwę skill,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować skill, oraz
pomagają automatycznym skanom wykrywać rozbieżności między deklarowanym i zaobserwowanym zachowaniem.

Zobacz [Format skill](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietów,
informacje o zgodności, linki źródłowe, artefakty i rekordy wersji.

Gdy OpenClaw instaluje plugin z ClawHub, przed instalacją sprawdza ogłaszane
metadane zgodności. Rekordy pakietów mogą obejmować zgodność API,
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

Używaj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed wysłaniem.
Następnie strony publiczne prezentują opublikowane metadane, pliki, atrybucję
źródła i status skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później
odnaleźć ten sam pakiet rejestru. CLI ClawHub obsługuje też bezpośrednie
przepływy pracy instalacji i aktualizacji skill dla użytkowników, którzy chcą
folderów skill zarządzanych przez rejestr poza pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom
wysyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Strony publiczne pokazują podsumowania skanów, gdy są dostępne. Treści
wstrzymane, ukryte lub zablokowane mogą zniknąć z publicznego wyszukiwania
i przepływów instalacji, pozostając widoczne dla właściciela na potrzeby diagnostyki.

Zobacz [Bezpieczeństwo](/clawhub/security), [Audyty bezpieczeństwa](/clawhub/security-audits),
[Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz
[Dopuszczalne użycie](/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne interfejsy API odczytu do odkrywania, wyszukiwania,
szczegółów pakietów i pobierania. Katalogi zewnętrzne mogą używać tych API,
gdy odsyłają do kanonicznej pozycji ClawHub, przestrzegają limitów szybkości
i unikają sugerowania poparcia.

Zobacz [Publiczne API](/clawhub/api) i [HTTP API](/clawhub/http-api).
