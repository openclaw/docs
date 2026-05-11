---
read_when:
    - Omówienie wpisów, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy ClawHub, wersje, instalacje, publikowanie, skany i aktualizacje.
x-i18n:
    generated_at: "2026-05-11T20:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla Skills i wtyczek OpenClaw. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane do bezpiecznego instalowania i aktualizowania tych pakietów.

## Rekordy rejestru

Każda publiczna pozycja to rekord rejestru z:

- właścicielem i slugiem albo nazwą pakietu
- jedną lub kilkoma opublikowanymi wersjami
- metadanymi, podsumowaniem, plikami i atrybucją źródła
- dziennikiem zmian i informacjami o tagach, takimi jak `latest`
- sygnałami pobrań, instalacji, gwiazdek i komentarzy
- stanem skanowania bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić,
co według deklaracji dana umiejętność lub wtyczka robi przed jej zainstalowaniem.

## Skills

Umiejętność to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter z `SKILL.md`, aby zrozumieć nazwę umiejętności,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne,
ponieważ pomagają użytkownikom zdecydować, czy zainstalować umiejętność, oraz
pomagają automatycznym skanom wykrywać niezgodności między deklarowanym a zaobserwowanym zachowaniem.

Zobacz [Format umiejętności](/pl/clawhub/skill-format).

## Wtyczki

Wtyczki to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietów,
informacje o zgodności, linki źródłowe, artefakty i rekordy wersji.

Gdy OpenClaw instaluje wtyczkę z ClawHub, sprawdza deklarowane metadane zgodności
przed instalacją. Rekordy pakietów mogą zawierać zgodność API,
minimalną wersję gatewaya, docelowe hosty, wymagania środowiskowe i skróty artefaktów.

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

Używaj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed przesłaniem. Strony publiczne następnie
prezentują opublikowane metadane, pliki, atrybucję źródła i stan skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później rozwiązać ten sam
pakiet rejestru. CLI ClawHub obsługuje także bezpośrednie przepływy instalacji i
aktualizacji umiejętności dla użytkowników, którzy chcą folderów umiejętności zarządzanych przez rejestr poza
pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom przesyłania,
automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Strony publiczne pokazują podsumowania skanowania, gdy są dostępne. Treści wstrzymane, ukryte
lub zablokowane mogą zniknąć z publicznego wyszukiwania i przepływów instalacji, pozostając
widoczne dla właściciela na potrzeby diagnostyki lub odwołania.

Zobacz [Bezpieczeństwo i moderacja](/pl/clawhub/security) oraz
[Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API tylko do odczytu na potrzeby odkrywania, wyszukiwania, szczegółów pakietów i
pobrań. Katalogi innych firm mogą używać tych API, gdy linkują z powrotem do
kanonicznej pozycji ClawHub, przestrzegają limitów żądań i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).
