---
read_when:
    - Chcesz wiedzieć, co oznacza npm shrinkwrap w wydaniu OpenClaw
    - Sprawdzasz pliki blokady pakietów, zmiany zależności lub ryzyko związane z łańcuchem dostaw
    - Sprawdzasz główne pakiety npm lub pakiety npm Plugin przed publikacją
summary: Proste i techniczne wyjaśnienie npm shrinkwrap w wydaniach OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:38:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw source checkouts używają `pnpm-lock.yaml`. Opublikowane pakiety npm OpenClaw używają `npm-shrinkwrap.json`, publikowalnego pliku blokady zależności npm, dzięki czemu instalacje pakietu używają grafu zależności sprawdzonego podczas wydania.

## Prosta wersja

Shrinkwrap to potwierdzenie dla drzewa zależności dostarczanego z pakietem npm. Informuje npm, które dokładne wersje pakietów przechodnich zainstalować.

W przypadku wydań OpenClaw oznacza to, że:

- opublikowany pakiet nie prosi npm o tworzenie świeżego grafu zależności w czasie instalacji;
- zmiany zależności są łatwiejsze do przejrzenia, ponieważ pojawiają się w pliku blokady;
- walidacja wydania może testować ten sam graf, który zainstalują użytkownicy;
- niespodzianki związane z rozmiarem pakietu lub zależnościami natywnymi łatwiej wykryć przed publikacją.

Shrinkwrap nie jest piaskownicą. Sam w sobie nie czyni zależności bezpieczną i nie zastępuje izolacji hosta, `openclaw security audit`, pochodzenia pakietu ani testów dymnych instalacji.

Krótki model mentalny:

| Plik                  | Gdzie ma znaczenie       | Co oznacza                       |
| --------------------- | ------------------------ | -------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw source checkout | Graf zależności maintainerów     |
| `npm-shrinkwrap.json` | Opublikowany pakiet npm  | Graf instalacji npm dla użytkowników |
| `package-lock.json`   | Lokalne aplikacje npm    | Nie jest kontraktem publikacji OpenClaw |

## Dlaczego OpenClaw go używa

OpenClaw to gateway, host pluginów, router modeli i środowisko uruchomieniowe agentów. Domyślna instalacja może wpływać na czas uruchamiania, użycie dysku, pobieranie pakietów natywnych i ekspozycję łańcucha dostaw.

Shrinkwrap daje przeglądowi wydania stabilną granicę:

- recenzenci widzą ruch zależności przechodnich;
- walidatory pakietów mogą odrzucać nieoczekiwane odchylenia pliku blokady;
- akceptacja pakietu może testować instalacje z grafem, który zostanie dostarczony;
- pakiety pluginów mogą mieć własny zablokowany graf zależności zamiast polegać na tym, że pakiet główny posiada zależności używane tylko przez plugin.

Celem nie jest „więcej plików blokady”. Celem są powtarzalne instalacje wydań z jasną własnością.

## Szczegóły techniczne

Główny pakiet npm `openclaw` oraz należące do OpenClaw pakiety npm pluginów zawierają `npm-shrinkwrap.json` podczas publikacji. Odpowiednie należące do OpenClaw pakiety pluginów mogą też publikować z jawnymi `bundledDependencies`, dzięki czemu ich pliki zależności środowiska uruchomieniowego są przenoszone w archiwum tarball pluginu zamiast zależeć wyłącznie od rozwiązywania w czasie instalacji.

Utrzymuj tę granicę w ten sposób:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator rozwiązuje publikowalny format blokady npm, ale odrzuca wygenerowane wersje pakietów, których nie ma już w `pnpm-lock.yaml`. Dzięki temu granica wieku zależności pnpm, nadpisań i przeglądu poprawek pozostaje nienaruszona.

Używaj poleceń tylko dla pakietu głównego wyłącznie wtedy, gdy celowo odświeżasz pakiet główny bez dotykania pakietów pluginów:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Traktuj te pliki jako wrażliwe pod kątem bezpieczeństwa:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- dołączone ładunki zależności pluginów
- dowolny diff `package-lock.json`

Walidatory pakietów OpenClaw wymagają shrinkwrap w nowych archiwach tarball pakietu głównego. Ścieżka publikacji pluginów npm sprawdza lokalny shrinkwrap pluginu, instaluje lokalne dla pakietu dołączone zależności, a następnie pakuje lub publikuje. Walidatory pakietów odrzucają `package-lock.json` dla opublikowanych pakietów OpenClaw.

Aby sprawdzić opublikowany pakiet główny:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Aby sprawdzić należący do OpenClaw pakiet pluginu:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Tło: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
