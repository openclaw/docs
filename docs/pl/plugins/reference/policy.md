---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz plugin zasad
summary: Dodaje oparte na zasadach kontrole polecenia doctor dotyczące zgodności obszaru roboczego.
title: Plugin zasad
x-i18n:
    generated_at: "2026-07-12T15:30:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin zasad

Dodaje oparte na zasadach kontrole narzędzia doctor sprawdzające zgodność obszaru roboczego.

## Dystrybucja

- Pakiet: `@openclaw/policy`
- Sposób instalacji: dołączony do OpenClaw

## Powierzchnia

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Działanie

Plugin zasad dodaje kontrole kondycji narzędzia doctor dla ustawień OpenClaw zarządzanych przez zasady oraz objętych nadzorem deklaracji obszaru roboczego. Zasady obejmują obecnie zgodność kanałów, metadane narzędzi objęte nadzorem, stan serwerów MCP, stan dostawców modeli, stan dostępu do sieci prywatnej, stan ekspozycji Gateway, stan obszaru roboczego i narzędzi agenta, skonfigurowany globalny i indywidualny dla agentów stan narzędzi, skonfigurowany stan środowiska wykonawczego piaskownicy, stan dostępu przychodzącego i kanałów, stan obsługi danych oraz stan dostawcy sekretów i profilu uwierzytelniania w konfiguracji OpenClaw.

Plugin zasad przechowuje utworzone wymagania w pliku `policy.jsonc`, traktuje istniejące ustawienia OpenClaw i deklaracje obszaru roboczego jako dowody oraz zgłasza rozbieżności za pomocą poleceń `openclaw policy check` i `openclaw doctor --lint`. Kontrola zasad zakończona bez problemów generuje zasady, dowody, ustalenia i skróty poświadczenia, które operatorzy mogą zarejestrować na potrzeby audytu.

Polecenie `openclaw policy compare --baseline <file>` porównuje jeden plik zasad z innym plikiem zasad. Sprawdza zgodność wyłącznie na poziomie konfiguracji: używa metadanych reguł zasad, aby zweryfikować, że sprawdzane zasady nie zawierają braków ani słabszych wymagań niż utworzona konfiguracja bazowa, i nie sprawdza stanu środowiska wykonawczego, poświadczeń ani wartości sekretów.

Reguły stanu narzędzi mogą wymagać zatwierdzonych profili, narzędzi systemu plików ograniczonych do obszaru roboczego, ograniczonych ustawień bezpieczeństwa/pytania/hosta dla wykonywania poleceń, wyłączonego trybu podwyższonych uprawnień, dokładnie określonych wpisów `alsoAllow` oraz wymaganych wpisów odmowy dla narzędzi. Dowody rejestrują dodatkowe wpisy `alsoAllow`, ponieważ mogą one rozszerzać efektywny stan narzędzi. Kontrole te sprawdzają wyłącznie zgodność konfiguracji; nie odczytują stanu zatwierdzeń środowiska wykonawczego ani nie dodają mechanizmów egzekwowania w środowisku wykonawczym.

Reguły stanu piaskownicy mogą wymagać zatwierdzonych trybów i mechanizmów zaplecza piaskownicy, zabraniać kontenerom korzystania z sieci hosta i dołączania do przestrzeni nazw kontenerów, wymagać montowania zasobów kontenera tylko do odczytu, zabraniać montowania gniazd środowiska wykonawczego kontenerów i używania nieograniczonych profili kontenerów oraz wymagać zakresów źródłowych CDP dla przeglądarki w piaskownicy.
Kontrole te sprawdzają wyłącznie zgodność konfiguracji; nie odczytują stanu zatwierdzeń środowiska wykonawczego, nie sprawdzają aktywnych kontenerów ani nie dodają mechanizmów egzekwowania w środowisku wykonawczym.

Reguły obsługi danych mogą wymagać redagowania poufnych informacji w dziennikach, zabraniać przechwytywania treści przez telemetrię, wymagać utrzymywania zasad przechowywania sesji oraz zabraniać indeksowania transkrypcji sesji w pamięci. Kontrole te sprawdzają wyłącznie zgodność konfiguracji; nie analizują nieprzetworzonych dzienników, eksportów telemetrii, transkrypcji, plików pamięci, sekretów ani danych osobowych.

Nazwane zakresy zasad w `scopes.<scopeName>` mogą dodawać bardziej rygorystyczne standardowe sekcje zasad dla określonego w nich selektora. `agentIds` obsługuje `tools`, `agents.workspace`, `sandbox` oraz `dataHandling.memory`; `channelIds` obsługuje `ingress.channels`.
Identyfikatory agentów środowiska wykonawczego, które nie są jawnie wymienione w `agents.list[]`, są sprawdzane względem odziedziczonego globalnego lub domyślnego stanu zamiast niejawnie przechodzić kontrolę bez żadnych dowodów. Każdy zakres obecny w `policy.jsonc` musi być prawidłowy i możliwy do wyegzekwowania dla swojego selektora. Reguły nakładane są dodatkowymi wymaganiami, więc nie osłabiają zasad najwyższego poziomu i mogą generować własne ustalenia, gdy ta sama zaobserwowana konfiguracja narusza oba zakresy.

<!-- openclaw-plugin-reference:manual-end -->

## Powiązana dokumentacja

- [zasady](/pl/cli/policy)
