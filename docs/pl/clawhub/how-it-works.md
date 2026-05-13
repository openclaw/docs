---
read_when:
    - Informacje o wpisach, wersjach, instalacjach, publikowaniu i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skanowanie i aktualizacje w ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla OpenClaw Skills i pluginów. Daje użytkownikom
miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a
OpenClaw wystarczające metadane, aby bezpiecznie instalować i aktualizować te pakiety.

## Rekordy rejestru

Każda publiczna pozycja to rekord rejestru z:

- właścicielem i slugiem albo nazwą pakietu
- jedną lub więcej opublikowanymi wersjami
- metadanymi, podsumowaniem, plikami i przypisaniem źródła
- dziennikiem zmian i informacjami o tagach, takimi jak `latest`
- sygnałami pobrań, instalacji, gwiazdek i komentarzy
- skanem bezpieczeństwa i statusem moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić, co dana Skill lub
plugin deklaruje, że robi, przed jej zainstalowaniem.

## Skills

Skill to wersjonowany pakiet tekstowy skoncentrowany wokół `SKILL.md`. Może zawierać
pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter pliku `SKILL.md`, aby zrozumieć nazwę Skill,
opis, wymagania, zmienne środowiskowe i metadane. Dokładne
metadane są ważne, ponieważ pomagają użytkownikom zdecydować, czy zainstalować Skill, oraz
pomagają automatycznym skanom wykrywać niezgodności między deklarowanym a zaobserwowanym zachowaniem.

Zobacz [Format Skill](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietu,
informacje o zgodności, linki źródłowe, artefakty i rekordy wersji.

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

Publikowanie tworzy nowy, niezmienny rekord wersji. Wydawcy używają CLI `clawhub`
do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj próbnych uruchomień, aby podejrzeć rozwiązany payload przed przesłaniem. Publiczne strony następnie
pokazują opublikowane metadane, pliki, przypisanie źródła i status skanu.

## Instalacje i aktualizacje

Polecenia instalacyjne OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później rozwiązać ten sam
pakiet rejestru. CLI ClawHub obsługuje również bezpośrednie przepływy instalacji i
aktualizacji Skill dla użytkowników, którzy chcą folderów Skill zarządzanych przez rejestr poza
pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom przesyłania,
automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Publiczne strony pokazują podsumowania skanów, gdy są dostępne. Treści wstrzymane, ukryte
lub zablokowane mogą zniknąć z publicznego wyszukiwania i przepływów instalacji, pozostając
widoczne dla właściciela do celów diagnostycznych.

Zobacz [Bezpieczeństwo i moderacja](/pl/clawhub/security) oraz
[Akceptowalne użytkowanie](/pl/clawhub/acceptable-usage).

## Dostęp API

ClawHub udostępnia publiczne API odczytu do odkrywania, wyszukiwania, szczegółów pakietów i
pobierania. Katalogi zewnętrzne mogą używać tych API, gdy linkują z powrotem do
kanonicznej pozycji ClawHub, respektują limity szybkości i unikają sugerowania rekomendacji.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).
