---
read_when:
    - Wdrażanie OpenClaw w Render
    - Chcesz deklaratywnie wdrożyć aplikację w chmurze za pomocą Render Blueprints
summary: Wdróż OpenClaw na Render przy użyciu infrastruktury jako kodu
title: Renderuj
x-i18n:
    generated_at: "2026-07-12T15:14:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Wdróż OpenClaw na platformie [Render](https://render.com), korzystając z Blueprintu `render.yaml` znajdującego się w repozytorium. Definiuje on usługę, dysk i zmienne środowiskowe w jednym pliku.

## Wymagania wstępne

- [Konto Render](https://render.com) (dostępny jest plan bezpłatny)
- Klucz API od wybranego [dostawcy modelu](/pl/providers)

## Wdrażanie

[Wdróż na Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Spowoduje to utworzenie usługi Render na podstawie pliku `render.yaml`, zbudowanie obrazu Docker i jego wdrożenie. Adres URL usługi ma postać `https://<service-name>.onrender.com`.

## Blueprint

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # automatycznie generuje bezpieczny token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Funkcja               | Przeznaczenie                                                         |
| --------------------- | --------------------------------------------------------------------- |
| `runtime: docker`     | Buduje obraz na podstawie pliku Dockerfile z repozytorium             |
| `healthCheckPath`     | Render monitoruje `/health` i ponownie uruchamia niesprawne instancje |
| `generateValue: true` | Automatycznie generuje wartość bezpieczną kryptograficznie            |
| `disk`                | Trwała pamięć masowa zachowywana między ponownymi wdrożeniami         |

## Wybór planu

| Plan      | Usypianie                    | Dysk        | Najlepsze zastosowanie             |
| --------- | ---------------------------- | ----------- | ---------------------------------- |
| Free      | Po 15 min bezczynności       | Niedostępny | Testy, prezentacje                 |
| Starter   | Nigdy                        | 1 GB+       | Użytek osobisty, małe zespoły      |
| Standard+ | Nigdy                        | 1 GB+       | Produkcja, wiele kanałów           |

Blueprint domyślnie korzysta z planu `starter`. Aby użyć planu bezpłatnego, zmień `plan: free` w pliku `render.yaml` w swoim forku. Pamiętaj, że bez trwałego dysku stan OpenClaw jest resetowany przy każdym wdrożeniu.

## Po wdrożeniu

### Dostęp do interfejsu sterowania

Panel internetowy jest dostępny pod adresem `https://<your-service>.onrender.com/`. Połącz się za pomocą współdzielonego sekretu: automatycznie wygenerowanego `OPENCLAW_GATEWAY_TOKEN` (znajdziesz go w **Dashboard → your service → Environment**) lub hasła, jeśli włączono uwierzytelnianie hasłem.

### Dzienniki

W sekcji **Dashboard → your service → Logs** są wyświetlane dzienniki kompilacji (tworzenie obrazu Docker), dzienniki wdrażania (uruchamianie usługi) oraz dzienniki środowiska uruchomieniowego (dane wyjściowe aplikacji).

### Dostęp do powłoki

Opcja **Dashboard → your service → Shell** otwiera sesję powłoki. Trwały dysk jest zamontowany w `/data`.

### Zmienne środowiskowe

Edytuj zmienne w sekcji **Dashboard → your service → Environment**. Zmiany powodują automatyczne ponowne wdrożenie.

### Automatyczne wdrażanie

Render automatycznie ponownie wdraża usługę, gdy w połączonej gałęzi repozytorium pojawi się nowy commit. Jeśli wdrożono usługę bezpośrednio z `openclaw/openclaw`, a nie z własnego forka, nie masz uprawnień do wypychania zmian, które mogłyby uruchomić ten proces. Aby przeprowadzić aktualizację, wykonaj ręczną synchronizację Blueprintu z poziomu Dashboard lub skieruj usługę na własny fork.

## Domena niestandardowa

1. **Dashboard → your service → Settings → Custom Domains**
2. Dodaj swoją domenę
3. Skonfiguruj DNS zgodnie z instrukcjami (rekord CNAME wskazujący na `*.onrender.com`)
4. Render automatycznie wystawi certyfikat TLS

## Skalowanie

- **Pionowe**: zmień plan, aby uzyskać więcej zasobów CPU/RAM. Zwykle jest to wystarczające dla OpenClaw.
- **Poziome**: zwiększ liczbę instancji (plan Standard lub wyższy). Wymaga to sesji trwałych albo zewnętrznego zarządzania stanem, ponieważ OpenClaw przechowuje stan środowiska uruchomieniowego na dysku lokalnym.

## Kopie zapasowe i migracja

W powłoce dostępnej z poziomu Dashboard Render możesz w dowolnym momencie wyeksportować stan, konfigurację, profile uwierzytelniania i przestrzeń roboczą:

```bash
openclaw backup create
```

Polecenie tworzy przenośne archiwum kopii zapasowej. Zobacz [Kopia zapasowa](/pl/cli/backup).

## Rozwiązywanie problemów

### Usługa nie uruchamia się

Sprawdź dzienniki wdrażania w Dashboard Render. Typowe problemy:

- Brak `OPENCLAW_GATEWAY_TOKEN` — sprawdź, czy ustawiono go w **Dashboard → Environment**
- Niezgodność portów — upewnij się, że ustawiono `OPENCLAW_GATEWAY_PORT=8080`, aby Gateway nasłuchiwał na porcie oczekiwanym przez Render

### Powolne uruchamianie po uśpieniu (plan bezpłatny)

Usługi w planie bezpłatnym są usypiane po 15 minutach bezczynności. Pierwsze żądanie po uśpieniu trwa kilka sekund, ponieważ kontener musi się uruchomić. Przejdź na plan Starter, aby usługa działała bez przerw.

### Utrata danych po ponownym wdrożeniu

Występuje w planie bezpłatnym (brak trwałego dysku). Przejdź na plan płatny lub regularnie eksportuj kopię zapasową za pomocą polecenia `openclaw backup create` w powłoce Render.

### Niepowodzenia kontroli kondycji

Jeśli kompilacja kończy się powodzeniem, ale wdrożenie nie, uruchamianie usługi może trwać zbyt długo lub punkt `/health` może być niedostępny. Sprawdź:

- Dzienniki kompilacji pod kątem błędów
- Czy kontener działa lokalnie po wykonaniu `docker build && docker run`

## Następne kroki

- Skonfiguruj kanały komunikacyjne: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Dbaj o aktualność OpenClaw: [Aktualizowanie](/pl/install/updating)
