---
read_when:
    - Chcesz wiedzieć, co oznacza npm shrinkwrap w wydaniu OpenClaw
    - Przeglądasz pliki blokady pakietów, zmiany zależności lub ryzyko związane z łańcuchem dostaw
    - Weryfikujesz główne pakiety npm lub pakiety npm Pluginów przed publikacją
summary: Przystępne i techniczne wyjaśnienie pliku npm shrinkwrap w wydaniach OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-12T15:09:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Wersje robocze kodu źródłowego OpenClaw używają pliku `pnpm-lock.yaml`. Opublikowane pakiety npm OpenClaw używają pliku `npm-shrinkwrap.json`, czyli przeznaczonego do publikacji pliku blokady zależności npm, dzięki czemu instalacje pakietów korzystają z grafu zależności sprawdzonego podczas wydania.

## Dlaczego to ważne

Shrinkwrap jest potwierdzeniem drzewa zależności dostarczanego z pakietem npm: wskazuje npm, które dokładne wersje zależności przechodnich należy zainstalować.

| Plik                  | Gdzie ma znaczenie               | Co oznacza                               |
| --------------------- | -------------------------------- | ---------------------------------------- |
| `pnpm-lock.yaml`      | Wersja robocza źródeł OpenClaw   | Graf zależności opiekunów projektu       |
| `npm-shrinkwrap.json` | Opublikowany pakiet npm           | Graf instalacji npm dla użytkowników     |
| `package-lock.json`   | Lokalne aplikacje npm             | Nie jest umową publikowania OpenClaw     |

W przypadku wydań OpenClaw oznacza to, że:

- opublikowany pakiet nie wymaga od npm tworzenia nowego grafu zależności podczas instalacji;
- zmiany zależności można przeglądać, ponieważ trafiają do różnic w pliku blokady;
- podczas weryfikacji wydania testowany jest ten sam graf, który zainstalują użytkownicy;
- niespodziewane zmiany rozmiaru pakietu lub zależności natywnych ujawniają się przed publikacją.

Shrinkwrap nie jest piaskownicą. Sam w sobie nie zapewnia bezpieczeństwa zależności i nie zastępuje izolacji hosta, polecenia `openclaw security audit`, pochodzenia pakietów ani testów dymnych instalacji.

OpenClaw pełni funkcję Gateway, hosta pluginów, routera modeli i środowiska uruchomieniowego agentów, dlatego domyślna instalacja wpływa na czas uruchamiania, wykorzystanie miejsca na dysku, pobieranie pakietów natywnych i narażenie łańcucha dostaw. Shrinkwrap zapewnia stabilną granicę podczas przeglądu wydania: recenzenci widzą zmiany zależności przechodnich, walidatory odrzucają nieoczekiwane rozbieżności pliku blokady, a pakiety pluginów zawierają własny zablokowany graf zależności zamiast polegać na pakiecie głównym.

## Generowanie i sprawdzanie

Główny pakiet npm `openclaw`, należące do OpenClaw pakiety pluginów npm (na przykład `@openclaw/discord`) oraz przeznaczone do publikacji pakiety obszaru roboczego, takie jak [`@openclaw/ai`](/reference/openclaw-ai), podczas publikacji zawierają plik `npm-shrinkwrap.json`. Zależności obszaru roboczego są pomijane w głównym pliku shrinkwrap, ponieważ są publikowane razem z pakietem głównym; zamiast tego każdy przeznaczony do publikacji pakiet obszaru roboczego przypina własne drzewo zależności przechodnich. Odpowiednie pakiety pluginów mogą być również publikowane z jawną konfiguracją `bundledDependencies`, która umieszcza pliki zależności środowiska uruchomieniowego w archiwum pluginu, zamiast polegać wyłącznie na rozwiązywaniu zależności podczas instalacji.

```bash
# Wszystkie pakiety zarządzane przez shrinkwrap (główny + pluginy przeznaczone do publikacji)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Tylko pakiet główny
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Tylko pakiety objęte bieżącym zestawem zmian
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Generator rozwiązuje przeznaczony do publikacji format blokady npm, ale odrzuca wygenerowane wersje pakietów, których nie ma już w pliku `pnpm-lock.yaml`. Pozwala to zachować granicę przeglądu wieku zależności pnpm, nadpisań i poprawek.

Następujące elementy należy przeglądać jako istotne dla bezpieczeństwa:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- dołączone zestawy zależności pluginów
- wszelkie różnice w pliku `package-lock.json`

Walidatory pakietów OpenClaw wymagają pliku shrinkwrap w nowych archiwach głównego pakietu i odrzucają plik `package-lock.json` w publikowanych pakietach. Ścieżka publikowania pluginów w npm sprawdza lokalny dla pluginu plik shrinkwrap, instaluje dołączone zależności lokalne dla pakietu, a następnie pakuje lub publikuje pakiet.

## Sprawdzanie opublikowanego pakietu

Pakiet główny:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Pakiet pluginu:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Informacje dodatkowe: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
