---
read_when:
    - Zrozumienie wyników audytu bezpieczeństwa ClawHub
    - Decydowanie, czy zainstalować umiejętność czy Plugin
    - Wyjaśnianie stanu audytu ClawHub, poziomu ryzyka lub ustaleń
sidebarTitle: Security Audits
summary: Jak rozumieć wyniki audytu bezpieczeństwa ClawHub przed zainstalowaniem umiejętności lub wtyczki.
title: Audyty bezpieczeństwa
x-i18n:
    generated_at: "2026-07-01T13:24:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audyty bezpieczeństwa

Audyty bezpieczeństwa ClawHub pomagają zdecydować, czy umiejętność lub Plugin jest wystarczająco bezpieczny do zainstalowania. Pokazują, co robi wydanie, jakich uprawnień wymaga oraz czy coś zasługuje na dodatkową uwagę, zanim uzyska dostęp do plików, kont, poświadczeń, kodu lub usług zewnętrznych.

Audyty są silnymi sygnałami bezpieczeństwa, ale nie gwarantują, że wydanie jest wolne od ryzyka. Zawsze używaj własnego osądu przed przyznaniem wrażliwego dostępu.

Zobacz też [Bezpieczeństwo](/clawhub/security), [Dopuszczalne użycie](/clawhub/acceptable-usage) oraz [Moderowanie i bezpieczeństwo konta](/clawhub/moderation).

## Co sprawdzić przed instalacją

Przed instalacją sprawdź:

- ogólny status audytu
- poziom ryzyka
- wszelkie wymienione ustalenia
- wymagane poświadczenia, uprawnienia lub zmienne środowiskowe
- właściciela, źródło, wersję, changelog, pobrania, gwiazdki i inne sygnały zaufania

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Status audytu

Status audytu mówi, jak zareagować na wynik audytu:

| Status      | Znaczenie                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Nie znaleziono widocznego problemu powyżej niskiego ryzyka.               |
| `Review`    | Przeczytaj ustalenia przed instalacją. Wydanie może nadal być prawidłowe. |
| `Warn`      | Zachowaj szczególną ostrożność. ClawHub znalazł istotny problem lub sygnał ostrzegawczy. |
| `Malicious` | Nie instaluj.                                                             |
| `Pending`   | Audyty nie zostały jeszcze ukończone.                                      |
| `Error`     | Nie udało się ukończyć audytu.                                             |

`Pass` uspokaja, ale nie zastępuje własnego osądu. Ma to największe znaczenie w przypadku narzędzi, które mogą publikować treści, edytować dane, uruchamiać polecenia, odczytywać pliki lub uzyskiwać dostęp do systemów produkcyjnych.

## Poziom ryzyka

Poziom ryzyka opisuje zasięg oddziaływania: jak dużą moc wydaje się mieć wydanie, jeśli używasz go zgodnie z przeznaczeniem.

| Poziom ryzyka | Znaczenie                                                                  |
| ------------- | -------------------------------------------------------------------------- |
| `Low`         | Znaleziono niewielkie wrażliwe uprawnienia lub niewielki wpływ na użytkownika. |
| `Medium`      | Wydanie ma znaczące uprawnienia, takie jak dostęp do konta lub zmiany danych. |
| `High`        | Wydanie ma uprawnienia o dużym wpływie, poważne ustalenia lub sygnały złośliwości. |

Poziom ryzyka i status audytu odpowiadają na różne pytania:

- Poziom ryzyka pyta: „Jak dużo mocy jest tutaj?”
- Status audytu pyta: „Co mam zrobić z tym wynikiem?”

Na przykład umiejętność publikowania może pokazywać `Review` z ryzykiem `Medium`. Nie oznacza to, że jest złośliwa. Oznacza to, że umiejętność wydaje się zgodna z celem, ale może działać z istotnymi uprawnieniami konta.

## Ustalenia

Ustalenia wyjaśniają, dlaczego pokazano dany wynik audytu. Każde ustalenie zwykle zawiera:

- co oznacza
- dlaczego zostało oznaczone
- odpowiednią treść umiejętności lub Plugin
- zalecenie

Ustalenia mogą mieć etykiety `Info`, `Low`, `Medium`, `High` lub `Critical`. Ustalenia o wyższej wadze silniej wpływają na poziom ryzyka i status audytu.

Ustalenia o niskiej pewności są ukrywane w publicznym podsumowaniu audytu, aby strona skupiała się na użytecznych dowodach.

## Co sprawdza ClawHub

ClawHub audytuje przesłane artefakty wydań, w tym:

- instrukcje umiejętności lub metadane Plugin
- zadeklarowane zmienne środowiskowe i uprawnienia
- instrukcje instalacji i metadane pakietu
- dołączone pliki i manifesty plików
- metadane zgodności i możliwości

Główne pytanie dotyczy spójności: czy nazwa, podsumowanie, metadane, żądane uprawnienia i rzeczywista treść są zgodne z tym, czego użytkownicy mogliby rozsądnie oczekiwać?

Potężne zachowanie nie jest automatycznie złe. Wiele użytecznych narzędzi potrzebuje poświadczeń, lokalnych poleceń, interfejsów API dostawców lub instalacji pakietów. Audyt sprawdza, czy ta moc jest oczekiwana, ujawniona i proporcjonalna.

Strony artefaktów prowadzą do pełnego audytu pod adresem:

```text
/<owner>/skills/<slug>/security-audit
```

Strona audytu łączy:

1. SkillSpector
2. VirusTotal
3. analizę ryzyka

## VirusTotal

ClawHub używa VirusTotal jako telemetrii złośliwego oprogramowania w stosie audytu. VirusTotal to zaufany standard branżowy dotyczący reputacji plików i skanowania złośliwego oprogramowania, a nasze partnerstwo pozwala ClawHub dodawać szerszą analizę bezpieczeństwa do przeglądu umiejętności i Plugin.

VirusTotal jest szczególnie użyteczny w przypadku znanych złośliwych artefaktów, wykryć silników oraz sygnałów reputacji, które uzupełniają agent-aware review ClawHub. Gdy dostępne są liczby wykryć od silników dostawców, audyt podsumowuje je prostym językiem, na przykład:

```text
62/62 vendors flagged this skill as clean.
```

lub:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Gdy ClawHub nie ma telemetrii liczby dostawców do podsumowania, audyt mówi:

```text
No VirusTotal findings
```

VirusTotal pozostaje telemetrią. Nie zastępuje własnej, świadomej artefaktów analizy ryzyka ClawHub.

## Analiza ryzyka

Analiza ryzyka jest wewnętrznie obsługiwana przez ClawScan, własny system audytu bezpieczeństwa ClawHub. Sprawdza każde wydanie jako artefakt przeznaczony dla agentów: instrukcje, metadane, zadeklarowane uprawnienia, pliki, sygnały możliwości, sygnały skanowania statycznego, ustalenia SkillSpector, telemetrię VirusTotal oraz kontekst dostarczony przez wydawcę. Sygnały skanowania statycznego są wewnętrznym kontekstem dla tego przeglądu; nie stanowią samodzielnej publicznej sekcji audytu ani werdyktu blokującego instalację.

Analiza ryzyka używa [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) jako perspektywy dla ryzyk takich jak prompt injection, niewłaściwe użycie narzędzi, ujawnienie poświadczeń, niebezpieczne wykonywanie, zatruwanie pamięci lub kontekstu oraz nadmierna sprawczość.

ClawScan nie traktuje groźnie wyglądającej możliwości jako automatycznie złośliwej. Pyta, czy możliwość jest ujawniona, zgodna z celem i wspierana przez deklarowany przypadek użycia wydania.
