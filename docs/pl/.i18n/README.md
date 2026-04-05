---
x-i18n:
    generated_at: "2026-04-05T13:42:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f07671afbba2efa77f5fb43ebed242d0fdca835f7810fdd60998e537b73d1efc
    source_path: .i18n/README.md
    workflow: 15
---

# Zasoby i18n dokumentacji OpenClaw

Ten folder przechowuje konfigurację tłumaczeń dla repozytorium źródłowego dokumentacji.

Wygenerowane drzewa lokalizacji i aktywna pamięć tłumaczeń znajdują się teraz w repozytorium publikacji:

- repozytorium: `openclaw/docs`
- lokalny checkout: `~/Projects/openclaw-docs`

## Źródło prawdy

- Angielska dokumentacja jest tworzona w `openclaw/openclaw`.
- Drzewo źródłowe dokumentacji znajduje się w `docs/`.
- Repozytorium źródłowe nie przechowuje już zatwierdzonych wygenerowanych drzew lokalizacji, takich jak `docs/zh-CN/**`, `docs/ja-JP/**`, `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**`, `docs/ar/**`, `docs/it/**`, `docs/tr/**`, `docs/id/**` lub `docs/pl/**`.

## Pełny przepływ

1. Edytuj angielską dokumentację w `openclaw/openclaw`.
2. Wypchnij zmiany do `main`.
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` odzwierciedla drzewo dokumentacji do `openclaw/docs`.
4. Skrypt synchronizacji przepisuje publikowane `docs/docs.json`, aby istniały tam wygenerowane bloki selektora lokalizacji, mimo że nie są już zatwierdzane w repozytorium źródłowym.
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` odświeża `docs/zh-CN/**` raz dziennie, na żądanie oraz po dyspozycjach publikacji z repozytorium źródłowego.
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml` robi to samo dla `docs/ja-JP/**`.
7. `openclaw/docs/.github/workflows/translate-es.yml`, `translate-pt-br.yml`, `translate-ko.yml`, `translate-de.yml`, `translate-fr.yml`, `translate-ar.yml`, `translate-it.yml`, `translate-tr.yml`, `translate-id.yml` i `translate-pl.yml` robią to samo dla `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**`, `docs/ar/**`, `docs/it/**`, `docs/tr/**`, `docs/id/**` i `docs/pl/**`.

## Dlaczego ten podział istnieje

- Utrzymanie wygenerowanych danych wyjściowych lokalizacji poza głównym repozytorium produktu.
- Utrzymanie Mintlify na pojedynczym opublikowanym drzewie dokumentacji.
- Zachowanie wbudowanego przełącznika języka przez to, że repozytorium publikacji jest właścicielem wygenerowanych drzew lokalizacji.

## Pliki w tym folderze

- `glossary.<lang>.json` — mapowania preferowanych terminów używane jako wskazówki w promptach.
- `ar-navigation.json`, `de-navigation.json`, `es-navigation.json`, `fr-navigation.json`, `id-navigation.json`, `it-navigation.json`, `ja-navigation.json`, `ko-navigation.json`, `pl-navigation.json`, `pt-BR-navigation.json`, `tr-navigation.json`, `zh-Hans-navigation.json` — bloki selektora lokalizacji Mintlify ponownie wstawiane do repozytorium publikacji podczas synchronizacji.
- `<lang>.tm.jsonl` — pamięć tłumaczeń indeksowana według workflow + model + hash tekstu.

W tym repozytorium wygenerowane pliki TM lokalizacji, takie jak `docs/.i18n/zh-CN.tm.jsonl`, `docs/.i18n/ja-JP.tm.jsonl`, `docs/.i18n/es.tm.jsonl`, `docs/.i18n/pt-BR.tm.jsonl`, `docs/.i18n/ko.tm.jsonl`, `docs/.i18n/de.tm.jsonl`, `docs/.i18n/fr.tm.jsonl`, `docs/.i18n/ar.tm.jsonl`, `docs/.i18n/it.tm.jsonl`, `docs/.i18n/tr.tm.jsonl`, `docs/.i18n/id.tm.jsonl` i `docs/.i18n/pl.tm.jsonl`, celowo nie są już zatwierdzane.

## Format słownika

`glossary.<lang>.json` to tablica wpisów:

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

Pola:

- `source`: angielska fraza (lub fraza źródłowa), którą należy preferować.
- `target`: preferowany wynik tłumaczenia.

## Mechanika tłumaczenia

- `scripts/docs-i18n` nadal odpowiada za generowanie tłumaczeń.
- Tryb dokumentacji zapisuje `x-i18n.source_hash` w każdej przetłumaczonej stronie.
- Każdy workflow publikacji wstępnie oblicza listę oczekujących plików przez porównanie bieżącego hasha źródła angielskiego z zapisanym lokalnym `x-i18n.source_hash`.
- Jeśli liczba oczekujących plików wynosi `0`, kosztowny krok tłumaczenia jest całkowicie pomijany.
- Jeśli są oczekujące pliki, workflow tłumaczy tylko te pliki.
- Workflow publikacji ponawia próby po przejściowych błędach formatu modelu, ale niezmienione pliki nadal są pomijane, ponieważ ten sam test hasha jest uruchamiany przy każdej próbie.
- Repozytorium źródłowe również wysyła odświeżenia zh-CN, ja-JP, es, pt-BR, ko, de, fr, ar, it, tr, id i pl po opublikowanych wydaniach GitHub, aby dokumentacja wydań mogła zostać zaktualizowana bez czekania na codzienny cron.

## Uwagi operacyjne

- Metadane synchronizacji są zapisywane w `.openclaw-sync/source.json` w repozytorium publikacji.
- Sekret repozytorium źródłowego: `OPENCLAW_DOCS_SYNC_TOKEN`
- Sekret repozytorium publikacji: `OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- Jeśli dane wyjściowe lokalizacji wyglądają na nieaktualne, najpierw sprawdź odpowiadający workflow `Translate <locale>` w `openclaw/docs`.
