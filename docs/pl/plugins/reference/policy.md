---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz Plugin zasad
summary: Dodaje kontrole doctor oparte na zasadach, sprawdzające zgodność przestrzeni roboczej.
title: Plugin zasad
x-i18n:
    generated_at: "2026-06-27T18:03:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin zasad

Dodaje oparte na zasadach kontrole doctor dotyczące zgodności obszaru roboczego.

## Dystrybucja

- Pakiet: `@openclaw/policy`
- Ścieżka instalacji: dołączony w OpenClaw

## Powierzchnia

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Zachowanie

Plugin zasad udostępnia kontrole kondycji doctor dla ustawień OpenClaw
zarządzanych zasadami oraz deklaracji obszaru roboczego objętych nadzorem. Zasady obecnie obejmują
zgodność kanałów, metadane narzędzi objęte nadzorem, stan serwera MCP, stan dostawcy modeli,
stan dostępu do sieci prywatnej, stan ekspozycji Gateway, stan obszaru roboczego/narzędzi agenta,
skonfigurowany globalny i per-agent stan narzędzi, skonfigurowany stan środowiska uruchomieniowego sandbox,
stan dostępu ingress/kanału, stan obsługi danych oraz stan dostawcy sekretów/profilu uwierzytelniania
konfiguracji OpenClaw.

Zasady przechowują wymagania zdefiniowane przez autora w `policy.jsonc`, obserwują istniejące
ustawienia OpenClaw i deklaracje obszaru roboczego jako dowody oraz zgłaszają rozbieżności
przez `openclaw policy check` i `openclaw doctor --lint`. Czysta kontrola zasad
emituje hashe zasad, dowodów, ustaleń i atestacji, które operatorzy
mogą zapisać na potrzeby audytu.

`openclaw policy compare --baseline <file>` porównuje jeden plik zasad z innym
plikiem zasad. Jest to wyłącznie zgodność na poziomie konfiguracji: używa metadanych reguł zasad,
aby zweryfikować, że sprawdzane zasady nie są niekompletne ani słabsze niż zdefiniowana
linia bazowa, i nie sprawdza stanu środowiska uruchomieniowego, poświadczeń ani wartości sekretów.

Reguły stanu narzędzi mogą wymagać zatwierdzonych profili, narzędzi systemu plików ograniczonych
wyłącznie do obszaru roboczego, ograniczonych ustawień bezpieczeństwa/ask/host dla exec, wyłączonego
trybu podwyższonego, dokładnych wpisów `alsoAllow` oraz wymaganych wpisów odmowy narzędzi.
Dowody rejestrują addytywne wpisy `alsoAllow`, ponieważ mogą poszerzać efektywny stan narzędzi.
Te kontrole obserwują wyłącznie zgodność konfiguracji; nie odczytują stanu zatwierdzeń
środowiska uruchomieniowego ani nie dodają egzekwowania w środowisku uruchomieniowym.

Reguły stanu sandbox mogą wymagać zatwierdzonych trybów/backendów sandbox, odmawiać sieci kontenera
hosta, odmawiać dołączania przestrzeni nazw kontenera, wymagać montowań kontenera tylko do odczytu,
odmawiać montowań gniazda środowiska uruchomieniowego kontenera i nieograniczonych profili kontenera
oraz wymagać zakresów źródeł CDP przeglądarki sandbox.
Te kontrole obserwują wyłącznie zgodność konfiguracji; nie odczytują stanu zatwierdzeń
środowiska uruchomieniowego, nie sprawdzają aktywnych kontenerów ani nie dodają egzekwowania w środowisku uruchomieniowym.

Reguły obsługi danych mogą wymagać redakcji poufnych danych w logach, odmawiać przechwytywania
treści telemetrycznych, wymagać utrzymania retencji sesji oraz odmawiać indeksowania pamięci
transkryptów sesji. Te kontrole obserwują wyłącznie zgodność konfiguracji; nie sprawdzają
surowych logów, eksportów telemetrycznych, transkryptów, plików pamięci, sekretów
ani danych osobowych.

Nazwane zakresy zasad w `scopes.<scopeName>` mogą dodawać bardziej rygorystyczne normalne sekcje zasad
dla wskazanego przez nie selektora. `agentIds` obsługuje `tools`,
`agents.workspace`, `sandbox` i `dataHandling.memory`; `channelIds` obsługuje
`ingress.channels`.
Identyfikatory agentów środowiska uruchomieniowego, które nie są jawnie wymienione w `agents.list[]`, są sprawdzane
względem odziedziczonego globalnego/domyślnego stanu, zamiast po cichu przechodzić bez
dowodów. Każdy zakres obecny w `policy.jsonc` musi być prawidłowy i możliwy do wyegzekwowania
dla swojego selektora. Reguły nakładek są dodatkowymi deklaracjami, więc nie osłabiają
zasad najwyższego poziomu i mogą generować własne ustalenia, gdy ta sama zaobserwowana
konfiguracja narusza oba zakresy.

<!-- openclaw-plugin-reference:manual-end -->

## Powiązana dokumentacja

- [zasady](/pl/cli/policy)
